interface ModalProps {
  isOpen: boolean;
  children: React.ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, children, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray flex items-center justify-center z-[1000] bg-gray-300">
      <div className="relative bg-[#F7F6DF] radius-2xl p-5 min-w-[300px] max-w-[90vw] max-h-[90vh] overflow-auto rounded-lg">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-transparent border-none text-2xl cursor-pointer text-gray-600 w-10 h-10 flex items-center justify-center"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
