import { container } from './select';

export default function(cond) {
    Object.defineProperty(window.HTMLElement.prototype, 'options', {
        get: function() {
            if (cond(this) && container.has(this)) {
                let instance = container.get(this);
                if (instance.optionsContainer == this)
                    return instance.optionsContainer.querySelectorAll('input~*')
                else
                    return instance.optionsContainer.children;
            }
        },
    })
}
