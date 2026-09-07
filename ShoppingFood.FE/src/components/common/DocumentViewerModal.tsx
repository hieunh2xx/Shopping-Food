import { X, FileText, Download, ExternalLink } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileType: string | null;
  fileName: string | null;
}

/**
 * Modal Xem trước Tài liệu Đính kèm (DocumentViewerModal).
 * Hỗ trợ xem trước trực tiếp các loại tệp: Hình ảnh (Image), Tài liệu PDF (qua thẻ iframe), và Tệp Word/Tài liệu khác (qua Google Docs Viewer hoặc nút tải xuống).
 * @param props - Thuộc tính cấu hình DocumentViewerModal
 */
export function DocumentViewerModal({
  isOpen,
  onClose,
  fileUrl,
  fileType,
  fileName
}: DocumentViewerModalProps) {
  if (!isOpen || !fileUrl) return null;

  const isImage = fileType?.startsWith('image/');
  const isPdf = fileType === 'application/pdf';
  const isWord = fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  
  // Kiểm tra xem URL có phải là Public Link không (bắt đầu bằng http/https)
  const isPublicUrl = fileUrl.startsWith('http://') || fileUrl.startsWith('https://');

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 truncate pr-4">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 truncate">{fileName || 'Tài liệu'}</h3>
              <p className="text-sm text-gray-500">Xem trước tài liệu đính kèm</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body Viewer */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4 flex flex-col">
          {isImage && (
            <div className="flex-1 flex items-center justify-center">
              <img 
                src={fileUrl} 
                alt={fileName || 'Document Preview'} 
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm border border-gray-200 bg-white"
              />
            </div>
          )}

          {isPdf && (
            <div className="flex-1 w-full h-[70vh] bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
              <iframe
                src={`${fileUrl}#view=FitH`}
                title={fileName || 'PDF Viewer'}
                className="w-full h-full border-0"
              />
            </div>
          )}

          {isWord && (
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md w-full">
                <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Tài liệu Microsoft Word</h4>
                
                {isPublicUrl ? (
                  <div className="space-y-4">
                    <p className="text-gray-500 text-sm mb-6">Trình duyệt không hỗ trợ đọc trực tiếp, bạn sẽ được chuyển hướng tới Google Docs Viewer.</p>
                    <a 
                      href={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Mở bằng Google Docs
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-500 text-sm mb-6">Đây là file nháp (Local File) chưa được tải lên máy chủ nên không thể xem trước bằng công cụ Online.</p>
                    <a 
                      href={fileUrl} 
                      download={fileName}
                      className="inline-flex items-center justify-center w-full gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/25"
                    >
                      <Download className="w-5 h-5" />
                      Tải xuống để xem
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isImage && !isPdf && !isWord && (
             <div className="flex-1 flex items-center justify-center">
               <div className="text-center">
                 <p className="text-gray-500 mb-4">Định dạng tệp không được hỗ trợ để xem trước.</p>
                 <a 
                    href={fileUrl} 
                    download={fileName}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Tải tệp xuống
                  </a>
               </div>
             </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
