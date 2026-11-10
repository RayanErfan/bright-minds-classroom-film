export async function launchBrowser(){
  let playwright;
  try {playwright=await import('playwright');}
  catch {
    try {playwright=await import(process.env.PLAYWRIGHT_MODULE || '/root/labworks/node_modules/playwright/index.mjs');}
    catch {throw new Error('Install the optional browser tools: npm install --no-save playwright && npx playwright install chromium');}
  }
  const mesa=process.env.RENDER_BACKEND==='mesa';
  return playwright.chromium.launch({headless:!mesa,args:['--no-sandbox','--disable-dev-shm-usage',...(mesa?['--use-gl=angle','--use-angle=gl','--ignore-gpu-blocklist','--disable-gpu-sandbox']:['--use-angle=swiftshader','--enable-unsafe-swiftshader'])]});
}
