import CoCreateSelect from "./select.js"
import crud from '@cocreate/crud-client';
import form from '@cocreate/form';
import * as config from './config';
import { container, selectedToOption } from './select';
import messageClient from '@cocreate/message-client';

const SelectAdapter = {

	init: function() {

		let containerList = document.querySelectorAll(config.containerSelector);

		for (let selectCon of containerList) {
			let instance = CoCreateSelect.init(selectCon);
			let { name, document_id, collection } = crud.getAttr(selectCon);
			if (name && document_id && collection)
				this.read(selectCon, instance)
		}
		this.__initEvents()
	},

	__initEvents: function() {
		const self = this;

		document.addEventListener('dndsuccess', function(e) {
			const { dropedEl, dragedEl } = e.detail;
			if (dropedEl.matches(config.containerSelector)) {
				container.get(dropedEl).__fireSelectedEvent({ selectContainer: dropedEl })
			}
		})

		document.addEventListener('input', function(e) {

			let { name, document_id, is_realtime } = crud.getAttr(e.target);

			if (e.target.matches(config.containerSelector)) {

				if (document_id === 'null')
					messageClient.send({
						broadcast_sender: false,
						rooms: "",
						emit: {
							message: "select",
							data: {
								name: e.target.getAttribute('name'),
								values: self.getAllValue(e.target)
							}
						},
					});
				else if (is_realtime)
					self.save(e.target);
			}
		})

		messageClient.listen('select', function(data) {
			let { name, values } = data;

			let select = document.querySelector(`[name="${name}"]`);

			if (!select || !container.has(select)) return;
			let instance = container.get(select);
			instance.unselectAll(false)
			values.forEach(value => instance.selectOption(value, true, value, false))

		})

		crud.listen('updateDocument', function(data) {
			if (data.metadata == 'cocreate-select') {
				for (let key of Object.keys(data['data'])) {
					self.writeSelect(data, key);
				}
			}
		})

	},

	// ToDo: Add directly to init
	read: async function(selectContainer, instance) {
		let data = await crud.read(selectContainer, false);
		let name = selectContainer.getAttribute('name');
		let options = data.data[name];
		options = Array.isArray(options) ? options : [options];
		options.forEach(op => instance.selectOption(op, true, undefined, false))
	},



	writeSelect: function(data, nameInDb) {
		for (let [el, instance] of container) {


			let { name, document_id, collection, is_listen } = crud.getAttr(el)

			if (is_listen)
				if (data['collection'] == collection && data['document_id'] == document_id && nameInDb == name) {

					if (data['data'][name]) {
						let options = data['data'][name];
						options = Array.isArray(options) ? options : [options];
						options.forEach(op => instance.selectOption(op, true, undefined, false))
					}
					else if (data['data'][name] === '')
						instance.unselectAll();

					break;
				}
		}
	},

	getAllValue: function(element) {
		let value = Array.from(element.selectedOptions)
			.map(selOption => selectedToOption.has(selOption) ? selectedToOption.get(selOption).getAttribute('value') : '');
		return value;
	},

	save: async function(element, isStore = true) {
		if (!isStore) return;
		let value = this.getAllValue(element)
		value = value.length <= 1 ? value[0] : value;
		value = value ? value : '';
		var data = [{
			element,
			value
		}];
		await crud.save(data)
	},



}

form.init({
	name: 'CoCreateSelect',
	callback: (form) => {
		let elements = form.querySelectorAll('cocreate-select')
		CoCreateSelect.save(elements)
	},
});


export default SelectAdapter;
