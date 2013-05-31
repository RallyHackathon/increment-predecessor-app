Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    launch: function() {
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
    	
    	this._retrieveModel();
    },

    _retrieveModel: function() {
    	var viewport = Ext.create('Ext.Viewport', {
			layout: 'border'
		});
    	Rally.data.ModelFactory.getModel({
		    type: 'portfolioitem/increment',
		    scope: this,
		    success: function(incrementModel) {
		    	this.grid = viewport.add({
		    		region: 'west',
		    		flex: 1,
		    		title: 'Increments',
		    		width: '30%',
	    			xtype: 'rallygrid',
		            model: incrementModel,
		            margin: '40 0 0 0',
		            columnCfgs: [
		                'FormattedID',
		                'Name'
		                //'Owner'
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
		console.log("the value of field " + field + " is " + value);
    	//alert(value);
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
