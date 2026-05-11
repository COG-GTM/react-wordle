import { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import useOnClickOutside from 'hooks/useOnClickOutside';
import { RiCloseCircleLine } from 'react-icons/ri';
import styles from './Modal.module.scss';

const Modal = ({ isOpen, onClose, title, children }) => {
  const nodeRef = useRef(null);
  const ref = useRef();

  useOnClickOutside(ref, onClose);

  return (
    <CSSTransition
      nodeRef={nodeRef}
      in={isOpen}
      timeout={300}
      classNames={'fade'}
      unmountOnExit
    >
      <div className={styles.modalContainer} ref={nodeRef}>
        <div className={styles.modal} ref={ref}>
          <button className={styles.close} onClick={onClose}>
            <RiCloseCircleLine size="1.6rem" color="var(--color-icon)" />
          </button>
          <h2 className={styles.title}>{title}</h2>
          {children}
        </div>
      </div>
    </CSSTransition>
  );
};

export default Modal;
