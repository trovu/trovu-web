import env from './env.js';
import Handle from './handle.js';

document.querySelector('body').onload = async function(event) {

  await env.populate();

  let handle = new Handle(env);
  let redirectUrl = await handle.getRedirectUrl();

  if (!redirectUrl) {
    let params = env.getParams();
    params.status = 'not_found';
    let paramStr = env.jqueryParam(params);
    redirectUrl = '../index.html#' + paramStr;
  }

  if (env.debug) {
    Helper.log("Redirect to:   " + redirectUrl)
    return;
  }

  window.location.href = redirectUrl;
}
