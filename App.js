Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    layout: 'hbox',

    launch: function() {
    	Rally.data.util.PortfolioItemHelper.loadTypeOrDefault({
            defaultToLowest: true,
            success: function(record) {
            	this.portfolioItemType = record;
               	this._retrieveModel();
            },
            scope: this
        });
    	this.add({
			type: 'container',
            flex: 1,
			height: '100%',
			items: [{
				xtype: 'rallyprojecttree',
	    		listeners: {
			        itemselected: {
			        	fn: this._handleProjectSelection,
			        	scope: this
			        }
			    }
			}]
		});
        this.visualizationContainer = this.add({
            type: 'container',
            flex: 4,
            id: 'infovis',
            width: '100%',
            height: '100%',
            componentCls: 'zombie'
        });
        var wsapiStore = Ext.create('Rally.data.WsapiDataStore', {
            model: 'Type Definition',
            scope: this,
            autoLoad: true,
            context: {
                workspace: this.getContext().getWorkspaceRef(),
                project: null
            },
            filters: [
                {
                    property: 'Name',
                    value: 'Hierarchical Requirement'
                }
            ],
            listeners: {
                load: {
                    fn: this._onPortfolioItemRetrieved,
                    scope: this
                }
            }
        })
    },

    _onPortfolioItemRetrieved: function(store) {
        this.storyPrefix = store.getAt(0).get('IDPrefix');
    },

    _retrieveModel: function(contextConfig) {
		if (typeof contextConfig === "undefined") {
			// TODO contextConfig = {};
			contextConfig = {
				project: '/project/9974888727',
				projectScopeDown: true
			};
		}
        this.portfolioItemTypePath = this.portfolioItemType.get('TypePath')
		console.log("contextConfig = " + JSON.stringify(contextConfig));
    	Rally.data.ModelFactory.getModel({
		    type: this.portfolioItemTypePath,
		    scope: this,
            context: contextConfig,
		    success: function(incrementModel) {
		    	this.grid = this.add({
                    flex: 1,
                    height: '100%',
		    		title: this.portfolioItemType.get('Name'),
	    			xtype: 'rallygrid',
		            model: incrementModel,
		            columnCfgs: [
		                'FormattedID',
		                'Name',
                        'DirectChildrenCount'
		            ],
		            listeners: {
		            	select: {
		            		fn: this._selectPortfolioItemFromGrid,
		            		scope: this
		            	}
		            }
		    	});
			}
		});
    },

	_handleProjectSelection: function(treeitem) {
        var projectUri = treeitem.getRecord().getRef().getUri();
    	var newcontextConfig = { 
    		project: projectUri,
    		projectScopeDown: true
	    };
	    console.log("project = " + projectUri);
    	this.grid.destroy();
    	this._retrieveModel(newcontextConfig)
    },

    _selectPortfolioItemFromGrid: function(row, record, index, eOpts) {
    	console.log("selected portfolio item: " + record.get('Name') + " with ID " + record.getId());
    	this.lookbackApiStore = Ext.create('Rally.data.lookback.SnapshotStore', {
            scope: this,
    		find: {
                '_TypeHierarchy': 'HierarchicalRequirement',
                '_ItemHierarchy': record.getId(),
                // 'Children': null,
                '__At': 'current'
            },
            fetch: ['Name', '_UnformattedID', 'ScheduleState', 'PlanEstimate', 'Predecessors', 'Successors', 'PortfolioItem'],
            hydrate: ['ScheduleState']
    	});

    	this.lookbackApiStore.load({
    		scope: this,
    		callback: function(records, operation, success) {
    			console.log("query # of records = " + records.length);
    			var childStories = Ext.Array.filter(records, function(story) {
    				return story.data.PortfolioItem == record.getId();
    			}, this)
    			console.log("count of child stories = " + childStories.length);
    			var json = {
    				id: record.getId(),
    				name: this._getHrefForStory(record.getId(), record.get('Name'), record.get('FormattedID'), Ext.util.Format.lowercase(this.portfolioItemTypePath), ''),
    				data: { Estimate: record.get('Rank') },
    				children: []
    			}
    			Ext.Array.each(childStories, function(value) {
                    json.children.push(this._addChildJson(childStories, value, record.getId()));
    			}, this);
    			console.log("json = " + JSON.stringify(json, null, 4));
                this._renderVisualization(json);
    		}
    	})
    },

    _addChildJson: function(childStories, value, prefix) {
        console.log("record = " + this.storyPrefix + value.data._UnformattedID);
        var children = [];

        if (value.data.Successors.length > 0) {
            Ext.Array.each(value.data.Successors, function(item) {
                var child = Ext.Array.filter(childStories, function(story) {
                    return story.data.ObjectID == item;
                });
                if (child.length == 1) {
                    children.push(this._addChildJson(childStories, child[0], '' + prefix + value.data.ObjectID + child[0].data.ObjectID));
                }
            }, this);
        }

        return {
            id: '' + prefix + value.data.ObjectID,
            name: this._getHrefForStory(value.data.ObjectID, value.data.Name, value.data._UnformattedID, 'userstory', this.storyPrefix),
            data: {},
            children: children
        };
    },

    _getHrefForStory: function(oid, name, fid, type, prefix) {
        return '<a href="https://rally1.rallydev.com/#/9974888727ud/detail/' + type + '/' + oid + '" title="' + name + '">' + prefix + fid + '</a>';
    },

    _renderVisualization: function(json) {
        this.visualizationContainer.update('');
        var st = new $jit.ST({
                //id of viz container element
                injectInto: 'infovis-body',
                //set duration for the animation
                duration: 800,
                // width: 600,
                //set animation transition type
                transition: $jit.Trans.Quart.easeInOut,
                //set distance between node and its children
                levelDistance: 50,
                //enable panning
                Navigation: {
                  enable:true,
                  panning:true
                },
                //set node and edge styles
                //set overridable=true for styling individual
                //nodes or edges
                Node: {
                    height: 50,
                    width: 100,
                    type: 'rectangle',
                    color: '#aaa',
                    overridable: true
                },
                
                Edge: {
                    type: 'bezier',
                    overridable: true,
                    color: '#252525'
                },
                
                onBeforeCompute: function(node){
                    console.log("loading " + node.name);
                },
                
                onAfterCompute: function(){
                    console.log("done");
                },
                
                //This method is called on DOM label creation.
                //Use this method to add event handlers and styles to
                //your node.
                onCreateLabel: function(label, node){
                    label.id = node.id;            
                    label.innerHTML = node.name;
                    label.onclick = function(){
                      st.onClick(node.id);
                    };
                    //set label styles
                    var style = label.style;
                    style.width = 100 + 'px';
                    style.height = 50 + 'px';            
                    style.cursor = 'pointer';
                    style.color = '#333';
                    style.fontSize = '1.3em';
                    style.textAlign= 'center';
                    style.paddingTop = '5px';
                    style.border = '2px solid #252525';
                },
                
                //This method is called right before plotting
                //a node. It's useful for changing an individual node
                //style properties before plotting it.
                //The data properties prefixed with a dollar
                //sign will override the global node style properties.
                onBeforePlotNode: function(node){
                    //add some color to the nodes in the path between the
                    //root node and the selected node.
                    if (node.selected) {
                        node.data.$color = "#ff7";
                    }
                    else {
                        delete node.data.$color;
                        //if the node belongs to the last plotted level
                        if(!node.anySubnode("exist")) {
                            //count children number
                            var count = 0;
                            node.eachSubnode(function(n) { count++; });
                            //assign a node color based on
                            //how many children it has
                            node.data.$color = ['#aaa', '#baa', '#caa', '#daa', '#eaa', '#faa'][count];                    
                        }
                    }
                },
                
                //This method is called right before plotting
                //an edge. It's useful for changing an individual edge
                //style properties before plotting it.
                //Edge data proprties prefixed with a dollar sign will
                //override the Edge global style properties.
                onBeforePlotLine: function(adj){
                    if (adj.nodeFrom.selected && adj.nodeTo.selected) {
                        adj.data.$color = "#ff0000";
                        adj.data.$lineWidth = 3;
                    }
                    else {
                        delete adj.data.$color;
                        delete adj.data.$lineWidth;
                    }
                }
            });
            //load json data
            st.loadJSON(json);
            //compute node positions and layout
            st.compute();
            //optional: make a translation of the tree
            st.geom.translate(new $jit.Complex(-200, 0), "current");
            //emulate a click on the root node.
            st.onClick(st.root);
            //end
    }

});
