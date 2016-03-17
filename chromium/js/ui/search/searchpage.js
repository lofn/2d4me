/*


*/

var SearchPage = React.createClass({
	displayName: 'SearchPage',

	getSearchResults: function () {
		var results = document.querySelectorAll('table.itg tr.gtr0, table.itg tr.gtr1');
		if (results && results.length > 0) {
			var galleryIDs = [];
			[].forEach.call(results, function (result) {
				var gid = result.querySelector('div.it5 a').href.split('/g/')[1].split('/')[0];
				galleryIDs.push(gid);
			});
			console.log('got galleryIDs: ' + JSON.stringify(galleryIDs));
		}
		if (results && galleryIDs && galleryIDs.length > 0) {
			this.setState({ results: galleryIDs });
		} else {
			console.log('no results');
		}
	},
	getInitialState: function () {
		return {
			results: [] // gallery IDs
		};
	},
	componentDidMount: function () {
		if (this.isMounted()) {
			console.log('reactdom mounted searchpage');
			this.getSearchResults();
		}
	},
	render: function () {
		return React.createElement(
			'div',
			null,
			React.createElement(SearchResults, { results: this.state.results }),
			React.createElement(FloatingControls, null)
		);
	}
});

/* ****************************************************************************** */

var FloatingControls = React.createClass({
	displayName: 'FloatingControls',

	getInitialState: function () {
		return {
			bgprimary: '#E3E0D1',
			bgsecondary: '#EDEBDF'
		};
	},
	componentDidMount: function () {
		if (this.isMounted()) {
			if (window.location.hostname !== 'g.e-hentai.org') {
				this.setState({ bgprimary: '#34353b', bgsecondary: '#4f535b' });
			}
		}
	},
	render: function () {
		return React.createElement(
			'div',
			{ className: 'mui-panel mui--z2', style: { 'position': 'fixed', 'width': '250px', 'maxHeight': '90%',
					'top': '20px', 'marginLeft': '960px', 'background': this.state.bgprimary, 'padding': '0' } },
			React.createElement(
				'ul',
				{ className: 'mui-tabs__bar', style: { 'padding': '5px', 'background': 'rgba(255,255,255,.7)' } },
				React.createElement(
					'li',
					null,
					React.createElement(
						'a',
						{ 'data-mui-toggle': 'tab', 'data-mui-controls': 'pane-default-1',
							style: { 'height': '20px', 'lineHeight': '20px', 'padding': '0 15px', 'textTransform': 'none', 'fontSize': '12px' } },
						'collections'
					)
				),
				React.createElement(
					'li',
					null,
					React.createElement(
						'a',
						{ 'data-mui-toggle': 'tab', 'data-mui-controls': 'pane-default-2',
							style: { 'height': '20px', 'lineHeight': '20px', 'padding': '0 15px', 'textTransform': 'none', 'fontSize': '12px' } },
						'settings'
					)
				),
				React.createElement(
					'li',
					{ className: 'mui--is-active' },
					React.createElement(
						'a',
						{ 'data-mui-toggle': 'tab', 'data-mui-controls': 'pane-default-3',
							style: { 'height': '20px', 'lineHeight': '20px', 'padding': '0 15px', 'textTransform': 'none', 'fontSize': '12px' } },
						'2d4me'
					)
				)
			),
			React.createElement(
				'div',
				{ className: 'mui-tabs__pane', id: 'pane-default-1' },
				'searches',
				React.createElement('br', null),
				'query + last viewed',
				React.createElement('hr', null),
				'pools'
			),
			React.createElement(
				'div',
				{ className: 'mui-tabs__pane', id: 'pane-default-2' },
				'settings'
			),
			React.createElement('div', { className: 'mui-tabs__pane mui--is-active', id: 'pane-default-3' })
		);
	}
});

/* ****************************************************************************** */

// add check to see if GalleryListItem gid is in 'hidethisforever'
// show minor text blurb that gid # was hidden, click to unhide

var SearchResults = React.createClass({
	displayName: 'SearchResults',

	render: function () {
		var searchNodes = this.props.results.map(function (result) {
			return React.createElement(GalleryListItem, { key: 'gid' + result, gid: result });
		});
		return React.createElement(
			'div',
			{ className: 'SearchResults mui-container', style: { 'margin': '0' } },
			searchNodes
		);
	}
});

/* ****************************************************************************** */

// hybrid thumbnail/list view -> also provide alt thumbnail and list views too?

var GalleryListItem = React.createClass({
	displayName: 'GalleryListItem',

	componentWillUnmount: function () {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	},
	getGalleryData: function () {
		var self = this;
		var port = chrome.runtime.connect({ name: 'galleryData' });
		port.postMessage({ getGalleryData: this.props.gid });
		port.postMessage({ getFavoriteCategory: this.props.gid });
		port.onMessage.addListener(function (msg) {
			if (msg.fcategory) {
				self.setState({ favoritecolor: self.getFavoriteColor(msg.fcategory) });
			} else {
				self.setState({
					source: msg.source,
					metadata: msg.metadata,
					attempts: self.state.attempts + 1
				});
				if (msg.source !== 'none' && msg.source !== 'nodata') {
					// source can be scraped/api
					self.setState({ galleryclass: 'mui-row ' + msg.metadata.category });
					if (msg.source !== 'api' && self.state.attempts < 15) {
						self.timeout = setTimeout(function () {
							self.getGalleryData();
						}, self.state.attempts * 500 + 1000);
					}
				} else {
					// no gallery data available for initial load
					// either an unknown error or really slow computer, rip
					if (self.state.attempts < 5) {
						self.timeout = setTimeout(function () {
							self.getGalleryData();
						}, self.state.attempts * 750 + 1000);
					}
				}
			}
		});
	},
	getInitialState: function () {
		return {
			attempts: 0,
			source: 'none',
			metadata: {},
			mousehover: false,
			favoritecolor: 'rgba(255,255,255,.1)',
			filecount: '+',
			bgprimary: '#E3E0D1',
			bgsecondary: '#EDEBDF'
		};
	},
	componentDidMount: function () {
		if (this.isMounted()) {
			this.getGalleryData();
			if (window.location.hostname !== 'g.e-hentai.org') {
				this.setState({ bgprimary: '#34353b', bgsecondary: '#4f535b' });
			}
		}
	},
	toggleMouseHover: function () {
		this.setState({ mousehover: true });
	},
	toggleMouseLeave: function () {
		this.setState({ mousehover: false });
	},
	getFavoriteColor: function (category) {
		var standardcategories = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
		if (!category || standardcategories.indexOf(category) === -1) {
			return 'rgba(255,255,255,.1)';
		} else {
			switch (true) {
				case category === 'a':
					return 'grey';
				case category === 'b':
					return 'red';
				case category === 'c':
					return 'orange';
				case category === 'd':
					return 'yellow';
				case category === 'e':
					return 'olive';
				case category === 'f':
					return 'lime';
				case category === 'g':
					return 'turquoise';
				case category === 'h':
					return 'navy';
				case category === 'i':
					return 'purple';
				case category === 'j':
					return 'pink';
				default:
					// should never happen
					return 'black';
			}
		}
	},
	activatePreviewModal: function () {
		var galleryPreviewModal = document.createElement('div');
		galleryPreviewModal.style.width = '1300px';
		galleryPreviewModal.style.maxWidth = '95%';
		galleryPreviewModal.style.height = '100%';
		galleryPreviewModal.style.margin = '0 auto';
		galleryPreviewModal.style.backgroundColor = 'rgba(255,255,255,.5)';

		var galleryPreviewIframe = document.createElement('iframe');
		galleryPreviewIframe.setAttribute('src', '/g/' + this.props.gid + '/' + this.state.metadata.token + '/');
		galleryPreviewIframe.style.width = '100%';
		galleryPreviewIframe.style.height = '100%';
		galleryPreviewIframe.style.border = '0';

		galleryPreviewIframe.onload = function () {
			if (galleryPreviewIframe.contentDocument.location.href.indexOf('/g/') === -1) {
				galleryPreviewModal.style.overflow = 'auto';
				galleryPreviewModal.style.resize = 'horizontal';
			} else {
				galleryPreviewModal.style.overflow = 'hidden';
				galleryPreviewModal.style.resize = 'none';
				galleryPreviewIframe.contentDocument.getElementsByTagName('p')[0].style.display = 'none';
			}
			galleryPreviewIframe.contentDocument.getElementsByTagName('body')[0].style.background = 'transparent';
		};

		galleryPreviewModal.appendChild(galleryPreviewIframe);
		mui.overlay('on', galleryPreviewModal);
		this.toggleMouseLeave();
	},
	activateFavoriteModal: function () {
		var galleryFavoriteModal = document.createElement('div');
		galleryFavoriteModal.style.width = '680px';
		galleryFavoriteModal.style.height = '420px';
		galleryFavoriteModal.style.margin = '100px auto 0 auto';
		galleryFavoriteModal.style.backgroundColor = 'transparent';

		var galleryFavoriteIframe = document.createElement('iframe');
		galleryFavoriteIframe.setAttribute('src', '/gallerypopups.php?gid=' + this.props.gid + '&t=' + this.state.metadata.token + '&act=addfav');
		galleryFavoriteIframe.style.width = '100%';
		galleryFavoriteIframe.style.height = '100%';
		galleryFavoriteIframe.style.border = '0';

		galleryFavoriteModal.appendChild(galleryFavoriteIframe);
		mui.overlay('on', galleryFavoriteModal);
		this.toggleMouseLeave();
	},
	render: function () {
		return React.createElement(
			'div',
			{ className: 'mui-panel mui--z2', style: { 'width': '930px', 'background': this.state.bgprimary },
				onMouseEnter: this.toggleMouseHover, onMouseLeave: this.toggleMouseLeave },
			React.createElement(
				'div',
				{ className: this.state.galleryclass },
				React.createElement(
					'div',
					{ className: 'mui-col-md-3 mui--text-center' },
					React.createElement(
						'a',
						{ href: '/g/' + this.props.gid + '/' + this.state.metadata.token + '/' },
						React.createElement('img', { src: this.state.metadata.thumb })
					),
					React.createElement(
						'button',
						{ className: 'mui-btn mui-btn--fab', onClick: this.activatePreviewModal,
							style: this.state.metadata.tags && this.state.mousehover ? { 'background': 'rgba(255,255,255,.1)', 'position': 'absolute', 'margin': '70px 0 0 -30px', 'color': 'transparent' } : { 'display': 'none' } },
						this.state.filecount
					)
				),
				React.createElement(
					'div',
					{ className: 'mui-col-md-9', style: { 'paddingLeft': '0' } },
					React.createElement(
						'div',
						{ className: 'mui-container-fluid' },
						React.createElement(
							'button',
							{ className: 'mui-btn mui-btn--raised mui--z1', onClick: this.activateFavoriteModal,
								style: this.state.mousehover || this.state.favoritecolor !== 'rgba(255,255,255,.1)' ? { 'position': 'absolute', 'margin': '0 0 0 675px', 'padding': '0 2px', 'color': 'transparent',
									'width': '15px', 'background': this.state.favoritecolor } : { 'display': 'none' } },
							'-'
						),
						React.createElement(
							'div',
							{ className: 'mui-row mui--text-title mui--z1',
								style: { 'padding': '8px', 'background': this.state.bgsecondary, 'marginBottom': '10px', 'fontSize': '15px', 'lineHeight': '20px' } },
							React.createElement(
								'a',
								{ href: '/g/' + this.props.gid + '/' + this.state.metadata.token + '/',
									style: true ? { 'display': 'block' } : { 'display': 'block', 'overflow': 'hidden', 'white-space': 'nowrap', 'textOverflow': 'ellipsis' } },
								this.state.metadata.title
							)
						),
						this.state.metadata.tags ? React.createElement(GalleryTags, { gid: this.props.gid, metadata: this.state.metadata }) : React.createElement(
							'div',
							{ className: 'mui-row mui--text-body1' },
							'waiting on API data'
						),
						React.createElement(
							'div',
							{ className: 'mui-row mui--text-right', style: { 'marginTop': '5px', 'opacity': '0' } },
							'gid ',
							this.props.gid,
							' data source: ',
							this.state.source
						)
					)
				)
			)
		);
	}
});

/* ****************************************************************************** */

var GalleryTags = React.createClass({
	displayName: 'GalleryTags',

	getInitialState: function () {
		return {
			tags: {
				'tags': ['not loaded'],
				'tagflags': []
			}
		};
	},
	getGalleryTagFlags: function () {
		var self = this;
		var port = chrome.runtime.connect({ name: 'galleryData' });
		port.postMessage({ getTagFlagData: this.props.gid });
		port.onMessage.addListener(function (msg) {
			self.setState({ tagflags: msg.tagflags });
		});
	},
	componentDidMount: function () {
		if (this.isMounted()) {
			var namespacedtags = {};
			if (this.props.metadata.tags && this.props.metadata.tags.length > 0) {
				this.props.metadata.tags.forEach(function (tag) {
					var data = tag.split(':');
					if (!data[1]) {
						data[1] = data[0];
						data[0] = 'misc';
					}
					if (!namespacedtags[data[0]]) {
						namespacedtags[data[0]] = [];
					}
					namespacedtags[data[0]].push(data[1]);
				});
			}
			this.setState({ tags: namespacedtags });
			this.getGalleryTagFlags();
		}
	},
	render: function () {
		var self = this;
		var galleryTagRows = Object.keys(this.state.tags).map(function (namespace) {
			return React.createElement(GalleryTagRow, { gid: self.props.gid, key: 'gid' + self.props.gid + 'ns' + namespace,
				namespace: namespace, tags: self.state.tags[namespace] });
		});
		return React.createElement(
			'div',
			{ className: 'mui-row' },
			React.createElement(AdditionalGalleryMetadata, { metadata: this.props.metadata }),
			React.createElement(
				'div',
				{ className: 'mui-col-md-8', style: { 'paddingLeft': '0' } },
				!!this.state.tagflags && this.state.tagflags.length > 0 && React.createElement(GalleryTagFlags, { tagflags: this.state.tagflags }),
				galleryTagRows
			)
		);
	}
});

/* ****************************************************************************** */

var GalleryTagFlags = React.createClass({
	displayName: 'GalleryTagFlags',

	render: function () {
		var bg = {
			red: '#fe5555',
			orange: '#fe8d55',
			yellow: '#fed455',
			green: '#aafe55',
			blue: '#557ffe',
			purple: '#a955fe'
		};
		return React.createElement(
			'div',
			{ className: 'mui-row mui--text-body1', style: { 'marginBottom': '4px' } },
			React.createElement(
				'div',
				{ className: 'mui-col-md-2 mui--text-right', style: { 'fontSize': '11px', 'marginTop': '2px', 'paddingLeft': '0' } },
				'flags'
			),
			React.createElement(
				'div',
				{ className: 'mui-col-md-10 mui--text-left', style: { 'padding': '0' } },
				this.props.tagflags.map(function (flag) {
					var color = Object.keys(flag)[0];
					return React.createElement(
						'a',
						{ className: 'mui-btn', key: color, style: { 'height': '20px', 'lineHeight': '13px', 'padding': '4px 10px',
								'fontSize': '11px', 'textTransform': 'none', 'margin': '2px 4px', 'background': bg[color], 'color': 'white' } },
						flag[color]
					);
				})
			)
		);
	}
});

/* ****************************************************************************** */

var AdditionalGalleryMetadata = React.createClass({
	displayName: 'AdditionalGalleryMetadata',

	render: function () {
		return React.createElement(
			'div',
			{ className: 'mui-col-md-4', style: { 'padding': '0' } },
			React.createElement(
				'div',
				{ className: 'mui-row mui--text-body1', style: { 'marginBottom': '4px' } },
				React.createElement(
					'div',
					{ className: 'mui-col-md-4 mui--text-right', style: { 'fontSize': '11px', 'marginTop': '2px' } },
					'uploader'
				),
				React.createElement(
					'div',
					{ className: 'mui-col-md-8 mui--text-left', style: { 'padding': '0' } },
					React.createElement(
						'a',
						{ className: 'mui-btn', href: '/uploader/' + this.props.metadata.uploader,
							style: { 'height': '20px', 'lineHeight': '13px', 'padding': '4px 10px', 'fontSize': '11px', 'textTransform': 'none', 'margin': '2px 0px' } },
						this.props.metadata.uploader
					)
				)
			),
			React.createElement(
				'div',
				{ className: 'mui-row mui--text-body1', style: { 'marginBottom': '4px' } },
				React.createElement(
					'div',
					{ className: 'mui-col-md-4 mui--text-right', style: { 'fontSize': '11px', 'marginTop': '2px' } },
					'uploaded'
				),
				React.createElement(
					'div',
					{ className: 'mui-col-md-8 mui--text-left', style: { 'fontSize': '11px', 'marginTop': '2px', 'padding': '0' } },
					new Date(parseInt(this.props.metadata.posted, 10) * 1000).toISOString().slice(0, 16).replace('T', ' ')
				)
			),
			React.createElement(
				'div',
				{ className: 'mui-row mui--text-body1', style: { 'marginBottom': '4px' } },
				React.createElement(
					'div',
					{ className: 'mui-col-md-4 mui--text-right', style: { 'fontSize': '11px', 'marginTop': '2px' } },
					this.props.metadata.expunged ? React.createElement(
						'span',
						{ style: { 'color': 'red', 'marginLeft': '10px' } },
						'expunged'
					) : React.createElement(
						'span',
						null,
						'category'
					)
				),
				React.createElement(
					'div',
					{ className: 'mui-col-md-8 mui--text-left', style: { 'fontSize': '11px', 'marginTop': '2px', 'padding': '0' } },
					this.props.metadata.category.toLowerCase()
				)
			),
			React.createElement(
				'div',
				{ className: 'mui-row mui--text-body1', style: { 'marginBottom': '4px' } },
				React.createElement(
					'div',
					{ className: 'mui-col-md-4 mui--text-right', style: { 'fontSize': '11px', 'marginTop': '2px' } },
					'files'
				),
				React.createElement(
					'div',
					{ className: 'mui-col-md-8 mui--text-left', style: { 'fontSize': '11px', 'marginTop': '2px', 'padding': '0' } },
					this.props.metadata.filecount + ' / ' + (this.props.metadata.filesize / (1024 * 1024)).toFixed(2) + ' MB'
				)
			),
			React.createElement(
				'div',
				{ className: 'mui-row mui--text-body1', style: { 'marginBottom': '4px' } },
				React.createElement(
					'div',
					{ className: 'mui-col-md-4 mui--text-right', style: { 'fontSize': '11px', 'marginTop': '2px' } },
					'rating'
				),
				React.createElement(
					'div',
					{ className: 'mui-col-md-8 mui--text-left', style: { 'fontSize': '11px', 'marginTop': '2px', 'padding': '0' } },
					this.props.metadata.rating
				)
			),
			React.createElement(
				'div',
				{ className: 'mui-row mui--text-body1', style: { 'marginBottom': '4px', 'opacity': '0' } },
				React.createElement(
					'div',
					{ className: 'mui-col-md-4 mui--text-right', style: { 'fontSize': '11px', 'marginTop': '2px' } },
					'your rating'
				),
				React.createElement(
					'div',
					{ className: 'mui-col-md-8 mui--text-left', style: { 'fontSize': '11px', 'marginTop': '2px', 'padding': '0' } },
					'?'
				)
			),
			React.createElement(
				'div',
				{ className: 'mui-row mui--text-body1', style: { 'marginBottom': '4px', 'opacity': '0' } },
				React.createElement(
					'div',
					{ className: 'mui-col-md-4 mui--text-right', style: { 'fontSize': '11px', 'marginTop': '2px' } },
					'your pools'
				),
				React.createElement(
					'div',
					{ className: 'mui-col-md-8 mui--text-left', style: { 'padding': '0' } },
					React.createElement(
						'a',
						{ className: 'mui-btn',
							style: { 'height': '20px', 'lineHeight': '13px', 'padding': '4px 10px', 'fontSize': '11px', 'textTransform': 'none', 'margin': '2px 0px' } },
						'+'
					)
				)
			),
			React.createElement(
				'div',
				{ className: 'mui-row mui--text-body1', style: { 'marginBottom': '4px', 'opacity': '0' } },
				React.createElement(
					'div',
					{ className: 'mui-col-md-4 mui--text-right', style: { 'fontSize': '11px', 'marginTop': '2px' } },
					'your note'
				),
				React.createElement(
					'div',
					{ className: 'mui-col-md-8 mui--text-left', style: { 'fontSize': '11px', 'marginTop': '2px', 'padding': '0' } },
					'?'
				)
			)
		);
	}
});

/* ****************************************************************************** */

var GalleryTagRow = React.createClass({
	displayName: 'GalleryTagRow',

	getTagLink: function () {
		if (this.props.namespace === 'misc') {
			return '/tag/' + tag;
		} else {
			return '/tag/' + namespace + ':' + tag;
		}
	},
	render: function () {
		var self = this;
		return React.createElement(
			'div',
			{ className: 'mui-row mui--text-body1', style: { 'marginBottom': '4px' } },
			React.createElement(
				'div',
				{ className: 'mui-col-md-2 mui--text-right', style: { 'fontSize': '11px', 'marginTop': '2px', 'paddingLeft': '0' } },
				this.props.namespace
			),
			React.createElement(
				'div',
				{ className: 'mui-col-md-10 mui--text-left', style: { 'padding': '0' } },
				this.props.tags.map(function (tag) {
					return React.createElement(
						'a',
						{ className: 'mui-btn', key: 'gid' + self.props.gid + 'ns' + self.props.namespace + 'tag' + tag,
							href: self.props.namespace === 'misc' ? '/tag/' + tag : '/tag/' + self.props.namespace + ':' + tag,
							style: { 'height': '20px', 'lineHeight': '13px', 'padding': '4px 10px', 'fontSize': '11px', 'textTransform': 'none', 'margin': '2px 4px' } },
						tag
					);
				})
			)
		);
	}
});

/* ****************************************************************************** */

var NativeSearchResults = document.querySelector('div[style="position:relative; z-index:2"]');

if (NativeSearchResults && NativeSearchResults.querySelector('table.itg')) {
	NativeSearchResults.querySelector('table.itg').style.display = 'none';

	var InjectedSearchResults = document.createElement('div');
	InjectedSearchResults.id = 'InjectedSearchResults';
	InjectedSearchResults.style.borderBottom = '1px solid black';
	InjectedSearchResults.style.borderTop = '1px solid black';
	InjectedSearchResults.style.paddingTop = '15px';

	NativeSearchResults.insertBefore(InjectedSearchResults, NativeSearchResults.querySelector('table.ptb'));
	ReactDOM.render(React.createElement(SearchPage, null), document.getElementById('InjectedSearchResults'));
}