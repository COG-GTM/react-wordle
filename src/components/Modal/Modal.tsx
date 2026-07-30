import { ReactNode, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import useOnClickOutside from 'hooks/useOnClickOutside';
import { RiCloseCircleLine } from 'react-icons/ri';
import styles from './Modal.module.scss';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useOnClickOutside(ref, onClose);

  return (
    <CSSTransition in={isOpen} timeout={300} classNames={'fade'} unmountOnExit>
      <div className={styles.modalContainer}>
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
