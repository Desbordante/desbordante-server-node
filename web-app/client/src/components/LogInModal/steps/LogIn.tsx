import { useMutation } from '@apollo/client';
import { FC } from 'react';
import { useForm } from 'react-hook-form';
import isEmail from 'validator/lib/isEmail';
import Button from '@components/Button';
import { Text } from '@components/Inputs';
import {
  logIn,
  logInVariables,
} from '@graphql/operations/mutations/__generated__/logIn';
import { LOG_IN } from '@graphql/operations/mutations/logIn';
import { useAuthContext } from '@hooks/useAuthContext';
import hashPassword from '@utils/hashPassword';
import styles from '../LogInModal.module.scss';
import Password from '@components/Inputs/Password';

type Inputs = {
  email: string;
  password: string;
};

const defaultValues: Inputs = {
  email: '',
  password: '',
};

interface Props {
  onSuccess: () => void;
  onRecovery: () => void;
}

const LogIn: FC<Props> = ({ onSuccess, onRecovery }) => {
  const { applyTokens } = useAuthContext();
  const {
    control, 
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Inputs>({
    defaultValues,
  });

  const [logIn] = useMutation<logIn, logInVariables>(LOG_IN);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await logIn({
        variables: {
          email: values.email,
          pwdHash: hashPassword(values.password),
        },
      });

      if (response.data?.logIn) {
        applyTokens(response.data.logIn);
        onSuccess();
      }
    } catch (e) {
      console.log(e);
    }
  });

  return (
    <>
      <h4 className={styles.title}>Log In</h4>
      <form onSubmit={onSubmit} className={styles.formContainer}>
        <div className={styles.inputGroup}>
          <Text
            label="Email"
            type="email"
            placeholder="your.email@example.com"
            {...register('email', {
              required: 'Required',
              validate: (value) => isEmail(value) || 'Invalid email',
            })}
            error={errors.email?.message}
          />
          <Password
            control={control}
            controlName="password"
            label="Password"
            placeholder="admin1234"
            rules={{ required: 'Required' }}
          />
        </div>

        <div className={styles.buttons}>
          <Button
            type="button"
            variant="secondary"
            onClick={onRecovery}
            disabled={isSubmitting}
          >
            Restore Password
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            Log In
          </Button>
        </div>
      </form>
    </>
  );
};

export default LogIn;
