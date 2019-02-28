var env = {};
async function getSuggestions() {

  let shortcutsKeyed = {}
  // Prefetch suggestions.
  // Iterate over namespaces in reverse order.
  for (namespace of env.namespaces.reverse()) {
    // Load precompiled JSON.
    let json = await fetchAsync('http://data.trovu.net/suggestions/' + namespace.name + '.json');
    if (!json) {
      continue;
    }
    let shortcuts = JSON.parse(json);
    // Iterate over all shortcuts.
    for (shortcut of shortcuts) {
      let key = shortcut.keyword + '.' + shortcut.arguments.length;
      // If not yet present: reachable.
      // (Because we started with most precendent namespace.)
      if (!(key in shortcutsKeyed)) {
        shortcut.reachable = true;
        shortcutsKeyed[key] = shortcut;
      }
      // Others are unreachable
      // but can be reached with namespace forcing.
      else {
        shortcut.reachable = false;
        shortcutsKeyed[key] = shortcut;
      }
    }
  }
  // Return array of values.
  return Object.values(shortcutsKeyed);
}

document.querySelector('body').onload = async function(event) {

  // Init environment.
  env = await getEnv();

  let params = getParams();

  // Show info alerts.
  switch (params.status) {
    case 'not_found':
      document.querySelector('#alert').removeAttribute('hidden');
      document.querySelector('#alert').textContent = 'Could not find a matching shortcut for this query.';
      break;
  }


  updateConfig();

  // Set query into input.
  document.querySelector('#query').value = env.query || '';

}

document.getElementById('query-form').onsubmit = function(event) {

  // Prevent default sending as GET parameters.
  event.preventDefault();

  let params = buildParams();
  params['query'] = document.getElementById('query').value; 

  let paramStr = jqueryParam(params);
  let processUrl = 'process/index.html?#' + paramStr;

  //console.log(processUrl);
  //return;

  // Redirect to process script.
  window.location.href = processUrl;
}

document.querySelector('button.add-search').onclick = function(event) {

  let urlOpensearch = document.querySelector('#linkSearch').getAttribute('href');
  window.external.AddSearchProvider(urlOpensearch);
}

document.querySelector('#settingsClose').onclick = function(event) {
  updateConfig();
}

function displaySettings() {

  let params = getParams()

  // Set settings fields from environment.
  document.querySelector('#languageSetting').value = env.language;
  document.querySelector('#countrySetting').value = env.country;

  document.querySelector('#settingsEnv').value = jsyaml.dump(env);

  if (env.github) {
    document.querySelector('.using-advanced').classList.remove('d-none');
    document.querySelector('.using-basic').classList.add('d-none');
  }
  else {
    document.querySelector('.using-basic').classList.remove('d-none');
    document.querySelector('.using-advanced').classList.add('d-none');
  }
}

function updateConfig() {

  if (!env.github) {
    env.namespaces = [
      'o',
      env.language,
      '.' + env.country
    ];
    env.namespaces = addFetchUrlTemplates(env.namespaces);
  }

  displaySettings();

  // Display "Saved.".
  document.querySelector('#settingsModal .saved').classList.remove('d-none');

  // Set Opensearch link.
  // TODO:
  // Why does let params not work here?
  params = buildParams();

  /*
  baseUrl = buildBaseUrl();
  let urlOpensearch = baseUrl + 'opensearch/?' + jqueryParam(params);

  let linkSearch = document.querySelector('#linkSearch');
  linkSearch.setAttribute('title', 'Trovu: ' + env.namespaces.join(','));
  linkSearch.setAttribute('href', urlOpensearch);

  // Set Process URL.
  let urlProcess = baseUrl + 'process/index.html#query=%s&' + jqueryParam(params);
  let preProcessUrl = document.querySelector('.process-url');
  preProcessUrl.textContent = urlProcess;
*/

  let paramStr = jqueryParam(params);
  window.location.hash = '#' + paramStr;
}

$('#settingsModal').on('show.bs.modal', function (e) {
  // Hide "Saved."
  document.querySelector('#settingsModal .saved').classList.add('d-none');
});

document.querySelector('#languageSetting').onchange = function(event) {
  env.language = event.target.value;
  updateConfig();
}

document.querySelector('#countrySetting').onchange = function(event) {
  env.country = event.target.value;
  updateConfig();
}
