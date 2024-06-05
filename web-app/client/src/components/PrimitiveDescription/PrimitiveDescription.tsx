import cn from 'classnames';
import { FC } from 'react';
import Icon from '@components/Icon';
import colors from '@constants/colors';
import { PrimitiveInfoType } from '@constants/primitiveInfoType';
import styles from './PrimitiveDescription.module.scss';

interface Props {
  info: PrimitiveInfoType;
  className?: string;
}

const PrimitiveDescription: FC<Props> = ({ className, info }) => (
  <small className={cn(className, styles.description)}>
    <Icon name="info" size={16} color={colors.primary[100]} />{' '}
    {info.description}{' '}
    {info.link && (
      <a href={info.link} target="_blank" rel="noreferrer">
        Learn more...
      </a>
    )}
  </small>
);

export default PrimitiveDescription;
