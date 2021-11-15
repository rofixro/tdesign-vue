import Vue, { VNode, VueConstructor } from 'vue';
import { ScopedSlotReturnValue } from 'vue/types/vnode';
import get from 'lodash/get';
import { renderTNodeJSX } from '../utils/render-tnode';
import { prefix } from '../config';
import CLASSNAMES from '../utils/classnames';
import ripple from '../utils/ripple';
import props from './option-props';
import { Options } from './type';
import Checkbox from '../checkbox/index';
import { SelectInstance } from './instance';
import { ClassName } from '../common';

const selectName = `${prefix}-select`;
export interface OptionInstance extends Vue {
  tSelect: SelectInstance;
}

export default (Vue as VueConstructor<OptionInstance>).extend({
  name: 'TOption',
  data() {
    return {
      isHover: false,
    };
  },
  props: { ...props },
  components: {
    TCheckbox: Checkbox,
  },
  directives: { ripple },
  inject: {
    tSelect: {
      default: undefined,
    },
  },
  watch: {
    value() {
      this.tSelect && this.tSelect.getOptions(this);
    },
    label() {
      this.tSelect && this.tSelect.getOptions(this);
    },
  },
  computed: {
    multiLimitDisabled(): boolean {
      if (this.tSelect && this.tSelect.multiple && this.tSelect.max) {
        if (
          this.tSelect.value instanceof Array
          && this.tSelect.value.indexOf(this.value) === -1
          && this.tSelect.max <= this.tSelect.value.length
        ) {
          return true;
        }
      }
      return false;
    },
    classes(): ClassName {
      return [
        `${prefix}-select-option`,
        {
          [CLASSNAMES.STATUS.disabled]: this.disabled || this.multiLimitDisabled,
          [CLASSNAMES.STATUS.selected]: this.selected,
          [`${CLASSNAMES.STATUS.selected}-multiple`]: this.tSelect && this.tSelect.multiple,
          [CLASSNAMES.SIZE[this.tSelect && this.tSelect.size]]: this.tSelect && this.tSelect.size,
        },
      ];
    },
    isCreatedOption(): boolean {
      return this.tSelect.creatable && this.value === this.tSelect.searchInput;
    },
    show(): boolean {
      /**
       * 此属性主要用于slots生成options时显示控制，直传options由select进行显示控制
       * create的option，始终显示
       * canFilter只显示待匹配的选项
       */
      if (!this.tSelect) return false;
      if (this.isCreatedOption) return true;
      if (this.tSelect.canFilter && this.tSelect.searchInput !== '') {
        return this.tSelect.filterOptions.some((option: Options) => get(option, this.tSelect.realValue) === this.value);
      }
      return true;
    },
    labelText(): string | number {
      return this.label || this.value;
    },
    selected(): boolean {
      let flag = false;
      if (!this.tSelect) return false;
      if (this.tSelect.value instanceof Array) {
        if (this.tSelect.labelInValue) {
          flag = this.tSelect.value.map((item) => get(item, this.tSelect.realValue)).indexOf(this.value) !== -1;
        } else {
          flag = this.tSelect.value.indexOf(this.value) !== -1;
        }
      } else if (typeof this.tSelect.value === 'object') {
        flag = get(this.tSelect.value, this.tSelect.realValue) === this.value;
      } else {
        flag = this.tSelect.value === this.value;
      }
      return flag;
    },
  },
  methods: {
    select(e: MouseEvent) {
      e.stopPropagation();
      if (this.disabled || this.multiLimitDisabled) {
        return false;
      }
      const parent = this.$el.parentNode as HTMLElement;
      if (parent && parent.className.indexOf(`${selectName}-create-option`) !== -1) {
        this.tSelect && this.tSelect.createOption(this.value);
      }
      this.tSelect && this.tSelect.onOptionClick(this.value, e);
    },
    mouseEvent(v: boolean) {
      this.isHover = v;
    },
  },
  mounted() {
    this.tSelect && this.tSelect.getOptions(this);
  },
  render(): VNode {
    const {
      classes, labelText, selected, disabled, multiLimitDisabled, show,
    } = this;
    const children: ScopedSlotReturnValue = renderTNodeJSX(this, 'default');
    const optionChild = children || labelText;
    return (
      <li
        v-show={show}
        class={classes}
        title={labelText}
        onMouseenter={ this.mouseEvent.bind(true) }
        onMouseleave={ this.mouseEvent.bind(false) }
        onClick={ this.select }
        v-ripple
      >
        {
          this.tSelect && this.tSelect.multiple
            ? <t-checkbox
                checked={selected}
                disabled={disabled || multiLimitDisabled}
                nativeOnClick={ (e: MouseEvent) => {
                  e.preventDefault();
                } }
              >
                {optionChild}
              </t-checkbox>
            : <span>{optionChild}</span>
        }
      </li>
    );
  },
});
