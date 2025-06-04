const fs = require('node:fs')
const puppeteer = require('puppeteer-extra')

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

let credentials = null
try {
  const fileContent = fs.readFileSync('credentials.json')
  credentials = JSON.parse(fileContent)
} catch (err) {
  console.log('No credentials.')
  return
}

;(async function() {
  const browser = await puppeteer.launch({ headless: false })
  const context = await browser.createBrowserContext()

  let cookies = null
  try {
    const fileContent = fs.readFileSync('cookies.json')
    cookies = JSON.parse(fileContent)
  } catch (err) {
    console.log('No cookies.')
  }
  await context.setCookie(...cookies)

  const page = await context.newPage()
  await page.setViewport({ width: 800, height: 800 })

  await page.goto('https://x.com/home')
  await page.waitForNetworkIdle({ idleTime: 1500 })

  await new Promise(r => setTimeout(r, 8000))
  return

  await page.waitForSelector("[autocomplete=username]")
  await page.type("input[autocomplete=username]", credentials.username, { delay: 50 })

  await page.evaluate(() =>
    document.querySelectorAll('button[role="button"]')[2].click()
  )
  await page.waitForNetworkIdle({ idleTime: 1500 })

  const extractedText = await page.$eval("*", (el) => el.innerText)
  if (extractedText.includes("Enter your phone number or username")) {
    await page.waitForSelector("[autocomplete=on]")
    await page.type("input[autocomplete=on]", credentials.user_handle, { delay: 50 })
    await page.evaluate(() =>
      document.querySelectorAll('button[role="button"]')[1].click()
    )
    await page.waitForNetworkIdle({ idleTime: 1500 })
  }

  await page.waitForSelector('[autocomplete="current-password"]')
  await page.type('[autocomplete="current-password"]', credentials.password, { delay: 50 })

  await page.evaluate(() =>
    document.querySelectorAll('button[role="button"]')[3].click()
  )
  await page.waitForNetworkIdle({ idleTime: 1500 })

  cookies = await context.cookies()
  await fs.writeFileSync('cookies.json', JSON.stringify(cookies))

  await context.close()
  await browser.close()
})()
