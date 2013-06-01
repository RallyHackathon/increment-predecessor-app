Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

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
    },

    _retrieveModel: function(contextConfig) {
		if (typeof contextConfig === "undefined") {
			contextConfig = {};
		}
		console.log("contextConfig = " + JSON.stringify(contextConfig));
    	Rally.data.ModelFactory.getModel({
		    type: this.portfolioItemType.get('TypePath'),
		    scope: this,
            context: contextConfig,
		    success: function(incrementModel) {
		    	this.grid = this.add({
		    		title: this.portfolioItemType.get('Name'),
		    		width: '30%',
	    			xtype: 'rallygrid',
		            model: incrementModel,
		            margin: '40 0 0 0',
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
    	console.log("selected record: " + record.get('Name'));

    	// Step 1 - Get portfolio item object from selected record id

    	// Step 2 - Get childen user story collection from selected portfolio item

    	// Step 3 - Iterate through each child to build JSON payload for each user story to pass to jit spacetree


    }

});
