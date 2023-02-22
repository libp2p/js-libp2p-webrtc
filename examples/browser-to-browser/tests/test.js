/* eslint-disable no-console */
import { test, expect } from '@playwright/test'
import { playwright } from 'test-util-ipfs-example'
import { spawn, exec } from 'child_process'
import { existsSync } from 'fs'

// Setup
const play = test.extend({
  ...playwright.servers()
})


// DOM
const connectBtn = '#connect'
const connectAddr = '#peer'
const connectPeerAddr = '#connected_peer'
const messageInput = '#message'
const sendBtn = '#send'
const output = '#output'

const message = 'hello'
let url

async function spawnGoLibp2p() {
  if (!existsSync('../../examples/go-libp2p-server/go-libp2p-server/relay')) {
    await new Promise((resolve, reject) => {
      exec('go build',
        { cwd: '../../examples/go-libp2p-server/relay' },
        (error, stdout, stderr) => {
          if (error) {
            throw (`exec error: ${error}`)
          }
          resolve()
        })
    })
  }

  const server = spawn('./relay', [], { cwd: '../../examples/go-libp2p-server/relay', killSignal: 'SIGINT' })
  server.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`, typeof data)
  })
  const serverAddr = await (new Promise(resolve => {
    server.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`, typeof data)
      const addr = String(data).match(/p2p addr:  ([^\s]*)/)
      if (addr !== null && addr.length > 0) {
        resolve(addr[1])
      }        
    })
  }))
  return { server, serverAddr }
}

play.describe('browser to browser example:', () => {
  let server
  let serverAddr

  // eslint-disable-next-line no-empty-pattern
  play.beforeAll(async ({ servers }, testInfo) => {
    testInfo.setTimeout(5 * 60_000)
    const s = await spawnGoLibp2p()
    server = s.server
    serverAddr = s.serverAddr
    console.log('Server addr:', serverAddr)
    url = `http://localhost:${servers[0].port}/`
  }, {})

  play.afterAll(() => {
    server.kill('SIGINT')
  })

  play.beforeEach(async ({ page }) => {
    await page.goto(url)
  })

  play('should connect to a go-libp2p relay node', async ({ page, context }) => {
    let peer = await per_page(page, serverAddr)

    // load second page and use `peer` as the connectAddr
    const pageTwo = await context.newPage();
    await pageTwo.goto(url)
    let newPeer = await per_page(pageTwo, peer)

    await page.fill(connectAddr, newPeer)
    await page.click(connectBtn)

    // send the relay message to the go libp2p server
    await page.fill(messageInput, message)
    await page.click(sendBtn)

    await page.waitForSelector('#output:has(div)')
    const connections = await page.textContent(output)

    // Expected output:
    //
    // Sending message '${message}'
    // Received message '${message}'
    expect(connections).toContain(`Sending message '${message}'`)
    expect(connections).toContain(`Received message '${message}'`)
  })
})

async function per_page(page, address) {
  // add the go libp2p multiaddress to the input field and submit
  await page.fill(connectAddr, address)
  await page.click(connectBtn)
  await page.fill(messageInput, message)

  await page.waitForSelector('#output:has(div)')

  // Expected output:
  //
  // Dialing '${serverAddr}'
  // Listening on '${peer}'
  const connections = await page.textContent(output)
  const peer = await page.textContent(connectPeerAddr)

  expect(connections).toContain(`Dialing '${address}'`)
  expect(connections).toContain(`Listening on '${peer}'`)
  
  return peer
}
