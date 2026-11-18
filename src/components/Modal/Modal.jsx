import { useEffect, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import useOnClickOutside from 'hooks/useOnClickOutside';
import { RiCloseLine } from 'react-icons/ri';
import styles from './Modal.module.scss';

const transitionClasses = {
  enter: styles.enter,
  enterActive: styles.enterActive,
  exit: styles.exit,
  exitActive: styles.exitActive,
};

const Modal = ({ isOpen, onClose, title, children }) => {
  const ref = useRef();
  const containerRef = useRef();

  useOnClickOutside(ref, onClose);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = event => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <CSSTransition
      in={isOpen}
      timeout={250}
      classNames={transitionClasses}
      nodeRef={containerRef}
      unmountOnExit
    >
      <div className={styles.modalContainer} ref={containerRef}>
        <div
          className={styles.modal}
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <button className={styles.close} onClick={onClose} aria-label="Close">
            <RiCloseLine size="1.4rem" />
          </button>
          <h2 className={styles.title}>{title}</h2>
          {children}
        </div>
      </div>
    </CSSTransition>
  );
};

export default Modal;
