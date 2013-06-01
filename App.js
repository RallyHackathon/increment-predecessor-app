Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    launch: function() {
    	Rally.data.util.PortfolioItemHelper.loadTypeOrDefault({
            defaultToLowest: true,
            success: function(record) {
               	this._retrieveModel(record);
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

    _retrieveModel: function(portfolioItemType) {
    	var viewport = Ext.create('Ext.Viewport', {
			layout: 'border'
		});
    	Rally.data.ModelFactory.getModel({
		    type: portfolioItemType.get('TypePath'),
		    scope: this,
		    success: function(incrementModel) {
		    	this.grid = viewport.add({
		    		region: 'west',
		    		flex: 1,
		    		title: portfolioItemType.get('Name'),
		    		width: '30%',
	    			xtype: 'rallygrid',
		            model: incrementModel,
		            margin: '40 0 0 0',
		            columnCfgs: [
		                'FormattedID',
		                'Name'
		            ]
		    	});
			}
		});
    	this.board = viewport.add({
    		region: 'east',
    		flex: 1,
    		width: '70%',
	        xtype: 'rallycardboard',
	        types: ['User Story'],
            margin: '40 0 0 0',
	        attribute: 'ScheduleState'
	    });    		
    },

	_handleProjectSelection: function(field, value, eOpts) {
    	var newStoreConfig = { 
    		storeConfig: {
	        	context: {
	        		project: value,
	        		projectScopeDown: true
	        	}
	        }
	    };
    	this.grid.refresh();
    	this.board.refresh(newStoreConfig);
    }

});
