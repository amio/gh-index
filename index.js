'use strict';

/**
 * gh-index
 * An directory index for gh-pages.
 */

window.addEventListener('DOMContentLoaded', function () {
  var wrapper = document.getElementById('gh-index');

  var raf = function () {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
      window.setTimeout(callback, 1000 / 60);
    };
  }();

  function insertStylesheet(url) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    document.head.appendChild(link);
  }

  function insertStylesheetAsync(url) {
    raf(function () {
      insertStylesheet(url);
    });
  }

  function getRepoInfo() {
    var repoconfig = (wrapper.getAttribute('data-repo') || wrapper.getAttribute('repo') || '').split('/');
    return {
      owner: repoconfig[0],
      name: repoconfig[1],
      branch: 'gh-pages'
    };
  }

  function loadTrees() {
    var repo = getRepoInfo();
    var cachedData = window.sessionStorage.getItem(repo.owner + '/' + repo.name);
    var treeData = cachedData && JSON.parse(cachedData);

    // Only fetch new data every 360 sec, to avoid github api restriction.
    if (treeData && Date.now() - treeData.timestamp < 360000) {
      index.refresh(treeData);
    } else {
      var uri = 'https://api.github.com/repos/' + repo.owner + '/' + repo.name + ('/git/trees/' + repo.branch + '?recursive=1');
      window.fetch(uri).then(function (resp) {
        return resp.json();
      }).then(function (result) {
        // cache request data
        // console.log(result.tree)
        result.tree.timestamp = Date.now();
        // window.sessionStorage.setItem(
        //   repo.owner + '/' + repo.name,
        //   JSON.stringify(result.tree)
        // )

        index.refresh(result.tree);
      });
    }
  }

  var index = {

    // RegExp for files to exclude
    excludes: new RegExp(document.body.getAttribute('data-excludes')),

    /**
     * Init gh-index
     */
    init: function init() {
      window.addEventListener('hashchange', index.hashRoute);
      insertStylesheet('http://amio.github.io/gh-index/index.css');
      insertStylesheetAsync('https://octicons.github.com/components/octicons/octicons/octicons.css');

      loadTrees();
    },

    /**
     * Everything after data loaded.
     * @param resp
     */
    refresh: function refresh(treeData) {
      // build tree
      index.tree = index.genTree(treeData);

      // build html
      index.hashRoute();
    },

    /**
     * Route task depends on current hash
     */
    hashRoute: function hashRoute() {
      var path = window.location.hash.substr(1).split('/');
      var sub = index.tree;

      while (sub && path.length && path[0]) {
        sub = sub[path.shift()];
      }

      index.updateIndexies(sub);
    },

    /**
     * Generate entire tree base on node list array return by Github API.
     * @param {Array} treeArr
     * @returns {Object}
     */
    genTree: function genTree(treeArr) {
      var root = {};
      for (var i = treeArr.length; i--;) {
        if (!this.excludes.test(treeArr[i].path)) {
          this.addItem(root, treeArr[i]);
        }
      }

      return root;
    },

    /**
     * Add an item into tree.
     * @param tree
     * @param item
     * @returns {*}
     */
    addItem: function addItem(tree, item) {
      var parent = tree;
      item.path.replace(/[^/]+/g, function (seg, idx) {
        parent[seg] || (parent[seg] = {});
        parent = parent[seg];
        return idx;
      });

      parent['/NODE/'] = item;

      return item;
    },

    /**
     * Update list base on tree
     * @param tree
     */
    updateIndexies: function updateIndexies(tree) {
      // generate header html
      var path = window.location.hash.replace('#', '');
      var header = '<div class="header"><span>•_•</span></div>';
      var parentLink = '#' + path.replace(/[^/]+\/$/, '');
      if (path) {
        header = '<div class="header"><a class="uplink" href="' + parentLink + '">' + (path + '<span>←_←</span></a></div>');
      }

      // generate list html
      var repo = getRepoInfo();
      var home = 'http://' + repo.owner + '.github.io/' + repo.name + '/';
      var items = Object.keys(tree).map(function (key) {
        if (key === '/NODE/') return '';

        var node = tree[key]['/NODE/'];
        var str = '';
        switch (node.type) {
          case 'blob':
            str = '<li class="blob"><a href="' + (home + node.path) + '">' + ('<span class="octicon octicon-file-text"></span> ' + node.path + '</a></li>');
            break;
          case 'tree':
            str = '<li class="tree"><a href="#' + node.path + '/">' + ('<span class="octicon octicon-file-directory"></span> ' + node.path + '/</a></li>');
            break;
        }
        return str;
      }).join('');
      var list = '<ul>' + items + '</ul>';

      // Generate footer html
      var footer = '<div class="footer">' + '<a href="http://github.com/amio/gh-index">gh-index</a> ' + 'by <a href="http://github.com/amio">amio</a></div>';

      // insert html
      wrapper.innerHTML = header + list + footer;
    }
  };

  index.init();
});