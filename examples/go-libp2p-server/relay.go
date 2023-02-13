package main

import (
	"bufio"
	"crypto/rand"
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/libp2p/go-libp2p"
	"github.com/libp2p/go-libp2p/core/crypto"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	// "github.com/libp2p/go-libp2p/core/peer"
	"github.com/libp2p/go-libp2p/p2p/muxer/mplex"
	ma "github.com/multiformats/go-multiaddr"
	relay "github.com/libp2p/go-libp2p/p2p/protocol/circuitv1/relay"
	webrtc "github.com/libp2p/go-libp2p/p2p/transport/webrtc"
)

var listenerIp = net.IPv4(127, 0, 0, 1)

func init() {
	ifaces, err := net.Interfaces()
	if err != nil {
		return
	}
	for _, iface := range ifaces {
		if iface.Flags&net.FlagUp == 0 {
			continue
		}
		addrs, err := iface.Addrs()
		if err != nil {
			return
		}
		for _, addr := range addrs {
			// bind to private non-loopback ip
			if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() && ipnet.IP.IsPrivate() {
				if ipnet.IP.To4() != nil {
					listenerIp = ipnet.IP.To4()
					return
				}
			}
		}
	}
}

func echoHandler(stream network.Stream) {
	for {
		reader := bufio.NewReader(stream)
		str, err := reader.ReadString('\n')
		log.Printf("err: %s", err)
		if err != nil {
			return
		}
		log.Printf("echo: %s", str)
		_, err = stream.Write([]byte(str))
		if err != nil {
			log.Printf("err: %v", err)
			return
		}
	}
}

func main() {
	makeRelayV1()
	// host := makeRelayV1()
	// host.SetStreamHandler("/echo/1.0.0", echoHandler)
	// defer host.Close()
	// remoteInfo := peer.AddrInfo{
	// 	ID:    host.ID(),
	// 	Addrs: host.Network().ListenAddresses(),
	// }

	// remoteAddrs, _ := peer.AddrInfoToP2pAddrs(&remoteInfo)
	// fmt.Println("p2p addr: ", remoteAddrs[0])

	fmt.Println("press Ctrl+C to quit")
	ch := make(chan os.Signal, 1)
	signal.Notify(ch, syscall.SIGTERM, syscall.SIGINT)
	<-ch
}

func createHost() host.Host {
	h, err := libp2p.New(
		libp2p.Transport(webrtc.New),
		libp2p.ListenAddrStrings(
			fmt.Sprintf("/ip4/%s/udp/0/webrtc", listenerIp),
		),
		libp2p.DisableRelay(),
		libp2p.Ping(true),
	)
	if err != nil {
		panic(err)
	}

	return h
}

func makeRelayV1() {
	r := rand.Reader
	// Generate a key pair for this host. We will use it at least
	// to obtain a valid host ID.
	priv, _, err := crypto.GenerateKeyPairWithReader(crypto.RSA, 2048, r)
	if err != nil {
		panic(err)
	}

	opts := []libp2p.Option{
		libp2p.DefaultTransports,
		libp2p.ListenAddrStrings(
			"/ip4/0.0.0.0/tcp/4003/ws",
		),
		libp2p.Identity(priv),
		libp2p.Muxer("/mplex/6.7.0", mplex.DefaultTransport),
		libp2p.EnableRelay(),
	}

	host, err := libp2p.New(opts...)
	if err != nil {
		panic(err)
	}

	_, err = relay.NewRelay(host)
	if err != nil {
		panic(err)
	}

	fmt.Println(host.Mux().Protocols())

	for _, addr := range host.Addrs() {
		a, err := ma.NewMultiaddr(fmt.Sprintf("/p2p/%s", host.ID().Pretty()))
		if err != nil {
			panic(err)
		}
		fmt.Println(addr.Encapsulate(a))
	}
}
