import { useRef } from 'react';
import useAlert from 'hooks/useAlert';
import classNames from 'classnames';
import { CSSTransition } from 'react-transition-group';
import { RiCheckboxCircleFill, RiErrorWarningFill } from 'react-icons/ri';
import styles from './Alert.module.scss';

const transitionClasses = {
  enter: styles.enter,
  enterActive: styles.enterActive,
  exit: styles.exit,
  exitActive: styles.exitActive,
};

const Alert = () => {
  const { message, status, isVisible } = useAlert();
  const ref = useRef();

  const classes = classNames({
    [styles.alert]: true,
    [styles.success]: status === 'success',
    [styles.error]: status === 'error',
  });

  const Icon = status === 'success' ? RiCheckboxCircleFill : RiErrorWarningFill;

  return (
    <div className={styles.alertContainer} role="status" aria-live="polite">
      <CSSTransition
        in={isVisible}
        timeout={250}
        classNames={transitionClasses}
        nodeRef={ref}
        unmountOnExit
      >
        <span className={classes} ref={ref}>
          <Icon className={styles.icon} aria-hidden="true" />
          {message}
        </span>
      </CSSTransition>
    </div>
  );
};

export default Alert;
