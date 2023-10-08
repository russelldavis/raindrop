import browser from 'webextension-polyfill'
import { environment } from '../environment'

async function onInstalled({ reason }) {
    switch(reason) {
        case 'install':
            if (!environment.includes('safari'))
                await browser.tabs.create({
                    url: '/welcome/index.html',
                    active: true
                })
            break
    }
}

async function onMessage({ type, url }, sender) {
    if (sender.id != browser.runtime.id) return

    switch(type) {
        case 'BOOKMARK_SUBMITTED': {
            // Notes:
            // - archive.today can't be automated like this, it uses CSRF tokens and captchas
            // - we could avoid no-cors by adding permissions in the manifest for archive.org,
            //   but the only effect of no-cors is we can't read the response, which we don't need
            await fetch('https://web.archive.org/save/' + url, {mode: 'no-cors'});
            break
        }
    }
}

export default function() {
    browser.runtime.onInstalled.addListener(onInstalled)
    browser.runtime.onMessage.removeListener(onMessage)
    browser.runtime.onMessage.addListener(onMessage)
}