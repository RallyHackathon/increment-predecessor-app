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
			height: '40px',
			items: [{
				xtype: 'rallyprojectpicker',
	    		listeners: {
			        change: {
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
            height: 400
        });
    },

    _retrieveModel: function(contextConfig) {
		if (typeof contextConfig === "undefined") {
			// TODO contextConfig = {};
			contextConfig = {
				project: '/project/9974888727',
				projectScopeDown: true
			};
		}
		console.log("contextConfig = " + JSON.stringify(contextConfig));
    	Rally.data.ModelFactory.getModel({
		    type: this.portfolioItemType.get('TypePath'),
		    scope: this,
            context: contextConfig,
		    success: function(incrementModel) {
		    	this.grid = this.add({
                    flex: 1,
		    		title: this.portfolioItemType.get('Name'),
		    		// width: '30%',
	    			xtype: 'rallygrid',
		            model: incrementModel,
		            // margin: '40 0 0 0',
		            columnCfgs: [
		                'FormattedID',
		                'Name'
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

	_handleProjectSelection: function(field, value, eOpts) {
    	var newcontextConfig = { 
    		project: value,
    		projectScopeDown: true
	    };
	    console.log("project = " + value);
    	this.grid.destroy();
    	this._retrieveModel(newcontextConfig)
    },

    _selectPortfolioItemFromGrid: function(row, record, index, eOpts) {
    	console.log("selected portfolio item: " + record.get('Name') + " with ID " + record.getId());
    	this.lookbackApiStore = Ext.create('Rally.data.lookback.SnapshotStore', {
    		find: {
                '_TypeHierarchy': 'HierarchicalRequirement',
                '_ItemHierarchy': record.getId(),
                // 'Children': null,
                '__At': 'current'
            },
            fetch: ['Name', 'ScheduleState', 'PlanEstimate', 'Predecessors', 'Successors', 'PortfolioItem'],
            hydrate: ['ScheduleState']
    	});

    	this.lookbackApiStore.load({
    		scope: this,
    		callback: function(records, operation, success) {
    			console.log("query # of records = " + records.length);
    			// 1. Find all records that are portfolio item child
    			var childStories = Ext.Array.filter(records, function(story) {
    				return story.data.PortfolioItem == record.getId();
    			}, this)
    			console.log("count of child stories = " + childStories.length);
    			// 2. For each child run through successors recursively into JSON for visualization
    			var json = {
    				id: record.getId(),
    				name: record.get('Name'),
    				data: { Estimate: record.get('Rank') },
    				children: []
    			}
    			Ext.Array.each(childStories, function(value) {
	    			console.log("record = " + value.data.Name);
	    			json.children.push({
	    				id: value.data.ObjectID,
	    				name: value.data.Name,
	    				data: {},
	    				children: []
	    			})
    			})
    			console.log("json = " + JSON.stringify(json));
                this._renderVisualization(json);
    		}
    	})
    },

    _renderVisualization: function(json) {
        var st = new $jit.ST({
                //id of viz container element
                injectInto: 'infovis-body',
                //set duration for the animation
                duration: 800,
                // width: 600,
                height: 400,
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
                    height: 20,
                    width: 60,
                    type: 'rectangle',
                    color: '#aaa',
                    overridable: true
                },
                
                Edge: {
                    type: 'bezier',
                    overridable: true
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
                    label.innerHTML = node.id;
                    label.onclick = function(){
                        if(normal.checked) {
                          st.onClick(node.id);
                        } else {
                        st.setRoot(node.id, 'animate');
                        }
                    };
                    //set label styles
                    var style = label.style;
                    style.width = 60 + 'px';
                    style.height = 17 + 'px';            
                    style.cursor = 'pointer';
                    style.color = '#333';
                    style.fontSize = '0.8em';
                    style.textAlign= 'center';
                    style.paddingTop = '3px';
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
                        adj.data.$color = "#eed";
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
