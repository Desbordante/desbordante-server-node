import cn from 'classnames';
import Slider, { SliderProps } from 'rc-slider';
import {
  ChangeEventHandler,
  FC,
  HTMLProps,
  ReactNode,
  useEffect,
  useId,
  useState,
} from 'react';
import Tooltip from '@components/Tooltip';
import colors from '@constants/colors';
import { InputPropsBase } from '..';
import styles from './NumberRange.module.scss';

type Value = [number | undefined, number | undefined];

const INFINITY_SYMBOL = 'inf';

const formatValue = (value: Value): string => {
  return value
    .map((v, index) => {
      if (v === undefined) {
        return `${index === 0 ? '-' : '+'}${INFINITY_SYMBOL}`;
      }

      return v;
    })
    .join(' ~ ');
};

const inferValue = (str: string): Value => {
  const parts = str.split(' ~ ');

  if (parts.length !== 2) {
    throw new Error();
  }

  return parts.map((part, index) => {
    const parsed = Number.parseFloat(part);
    if (!isNaN(parsed)) {
      return parsed;
    }

    if (part === `${index === 0 ? '-' : '+'}${INFINITY_SYMBOL}`) {
      return undefined;
    }

    throw new Error();
  }) as Value;
};

type Props = InputPropsBase &
  Omit<HTMLProps<HTMLInputElement>, 'value' | 'onChange'> & {
    value: Value;
    onChange: (newValue: Value) => void;
    sliderProps?: SliderProps;
    tooltip?: ReactNode;
  };

const NumberRange: FC<Props> = ({
  id,
  label,
  error,
  className,
  tooltip,
  value,
  onChange,
  sliderProps,
  ...props
}) => {
  const [inputText, setInputText] = useState('');
  const uniqueId = useId();

  useEffect(() => {
    setInputText(formatValue(value));
  }, [value]);

  const min = sliderProps?.min || 0;
  const max = sliderProps?.max || 100;
  const dot2 = (min + max) / 2;
  const dot1 = (min + dot2) / 2;
  const dot3 = dot2 + dot2 - dot1;

  const marks =
    (sliderProps?.step || 1) % 1 === 0
      ? {
          [min]: { style: { top: -35 }, label: min },
          [Math.floor(dot1)]: ' ',
          [Math.floor(dot2)]: {
            style: { top: -40 },
            label: [Math.floor(dot2)],
          },
          [Math.floor(dot3)]: ' ',
          [max]: { style: { top: -35 }, label: max },
        }
      : {
          [min]: { style: { top: -35 }, label: min },
          [dot1]: ' ',
          [dot2]: { style: { top: -35 }, label: [dot2] },
          [dot3]: ' ',
          [max]: { style: { top: -35 }, label: max },
        };

  const inputId = id || uniqueId;

  const sliderValue = value.map((v, index) => {
    if (v !== undefined) {
      return v;
    }

    return index === 0 ? min : max;
  });

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const { value } = event.target;

    setInputText(value);

    try {
      onChange(inferValue(value));
    } catch (e) {}
  };

  return (
    <div className={cn(className, styles.inputNumberRange)}>
      <div className={styles.top}>
        {label && <label htmlFor={inputId}>{label}</label>}
        {tooltip && <Tooltip>{tooltip}</Tooltip>}
      </div>
      <div className={styles.inputContainer}>
        <input
          type="text"
          id={inputId}
          value={inputText}
          onChange={handleInputChange}
          className={cn(error && styles.error)}
          {...props}
        />
        <Slider
          range
          marks={marks}
          className={styles.sliderTrack}
          trackStyle={{
            height: 2,
            transform: 'translateY(-1px)',
            zIndex: 1,
            backgroundColor: colors.black[100],
          }}
          railStyle={{ height: 1, backgroundColor: colors.black[25] }}
          allowCross={false}
          dotStyle={{
            borderRadius: 5,
            height: 8,
            bottom: 0,
            borderWidth: 1,
            width: 0,
            borderColor: colors.black[25],
          }}
          value={sliderValue}
          onChange={(v) => {
            if (!Array.isArray(v) || v.length !== 2) return;
            onChange(v as Value);
          }}
          handleRender={(origin) => (
            <div {...origin.props} className={styles.sliderHandle} />
          )}
          {...sliderProps}
        />
      </div>
    </div>
  );
};

export default NumberRange;
