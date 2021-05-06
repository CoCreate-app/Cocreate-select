const CoCreateSelectAdapter = {
  
  init: function() {
    this.initElement();
    this.__initEvents()
  },
  
  initElement: function(container) {
    const mainContainer = container || document;
    if (!mainContainer.querySelectorAll) {
      return;
    }
  
    let containerList = mainContainer.querySelectorAll('cocreate-select, div.select--field');
    for(let i = 0 ; i < containerList.length ; i++){
      CoCreateSelect.__initSelect(containerList[i]);
      this.__initElementEvent(containerList[i]);
    }
  },
  
  __initEvents: function() {
    const self = this;
    document.addEventListener('dndsuccess', function(e) {
			const {dropedEl, dragedEl} = e.detail;
      if ((typeof dropedEl.tagName != 'undefined' && dropedEl.tagName.toLowerCase() == 'cocreate-select') 
          || dropedEl.classList.contains('select--field')) 
      {
        self.save(dropedEl)
        dropedEl.dispatchEvent(new CustomEvent('selectedValue'));
      }
		})
		
		
		document.addEventListener('CoCreateSelect-save', function(e) {
		  const {detail: {element}} = e;
		  if (!element) {
		    return;
		  }
		  
		  self.save(element);
		})
		
		CoCreate.socket.listen('readDocument', function(data) {
		  if (data.metadata == 'cocreate-select') {
  		  CoCreateSelect.setValue(data);
		  }
		})
		
		CoCreate.socket.listen('updateDocument', function(data) {
		  if (data.metadata == 'cocreate-select') {
  		  CoCreateSelect.setValue(data);
		  }
		})
		
		document.addEventListener('CoCreate-selected', function(e){
		  const {detail: {element, value}} = e;
		  console.log(e.detail)
		  
		})
  },
  
  __initElementEvent: function(selectContainer) {
    const self = this;
    selectContainer.addEventListener('clicked-submitBtn', function() {
      self.save(this)
    })
    
    selectContainer.addEventListener('set-document_id', function() {
      self.save(this)
    })
    
    //. fetch logic
    let collection = selectContainer.getAttribute('data-collection') || 'module_activity';
    let id = selectContainer.getAttribute('data-document_id');
    
    if (collection && id) {
      CoCreate.crud.readDocument({
        'collection': collection, 
        'document_id': id,
        'metadata': 'cocreate-select'
      })
    }
  },
  
  __sendRequest: function(selectContainer) {
    let collection = selectContainer.getAttribute('data-collection') || 'module_activity';
    let id = selectContainer.getAttribute('data-document_id');
    
    if (collection && id) {
      CoCreate.crud.readDocument({
        'collection': collection, 
        'document_id': id,
        'metadata': 'cocreate-select'
      })
    }
  },

  save: function(element, isStore = true) {
  
    let value = CoCreateSelect.getValue(element);
    
    let collection = element.getAttribute('data-collection') || 'module_activity';
    
    let id = element.getAttribute('data-document_id');
    let name = element.getAttribute('name');
    let realtime = element.getAttribute('data-realtime') || "true";
    if (!name) return;
    
    if (realtime != "true" && !isStore) return;
    
    if (element.getAttribute('data-save_value') == 'false') {
      return;
    }
    
    if (!CoCreate.form.checkID(element)) {
      CoCreate.form.request({element, value, nameAttr: "name"});
      element.setAttribute('data-document_id', 'pending');
    } else if (id) {
      CoCreate.crud.updateDocument({
        'collection': collection, 
        'document_id': id, 
        'data' : { 
          [name] : value 
        },
        'upsert': true,
        'metadata': 'cocreate-select'
      })
    }
    
  },
}

CoCreateSelectAdapter.init();

CoCreate.observer.init({ 
	name: 'CoCreateSelectAttributes', 
	observe: ['attributes'],
	attributes: ['data-document_id'],
	include: 'cocreate-select', 
	callback: function(mutation) {
		CoCreateSelectAdapter.__sendRequest(mutation.target)
	}
});

CoCreate.observer.init({ 
	name: 'CoCreateSelect', 
	observe: ['subtree', 'childList'],
	include: 'cocreate-select', 
	callback: function(mutation) {
		CoCreateSelectAdapter.initElement(mutation.target)
	}
});