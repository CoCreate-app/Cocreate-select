import {container} from './select';

export default function(cond) {
    Object.defineProperty(window.HTMLElement.prototype, 'selectedIndex', {
        get: function() {
            if (cond(this) && container.has(this))
                return container.get(this).selectedContainer.children;
        },
    })
}
