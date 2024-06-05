import { DefaultContext, useMutation, useQuery } from '@apollo/client';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import cardStyles from '@components/DatasetCard/DatasetCard.module.scss';
import FilePropertiesModal from '@components/FilePropertiesModal';
import Icon from '@components/Icon';
import ProgressBar, { Progress } from '@components/ProgressBar/ProgressBar';
import {
  uploadDataset,
  uploadDatasetVariables,
} from '@graphql/operations/mutations/__generated__/uploadDataset';
import { UPLOAD_DATASET } from '@graphql/operations/mutations/uploadDataset';
import { getAlgorithmsConfig } from '@graphql/operations/queries/__generated__/getAlgorithmsConfig';
import { GET_ALGORITHMS_CONFIG } from '@graphql/operations/queries/getAlgorithmsConfig';
import { AllowedDataset } from 'types/algorithms';
import styles from './DatasetUploader.module.scss';

type Props = {
  onUpload: (file: AllowedDataset) => void;
  isOpen: boolean;
  setIsOpen: (prop: boolean) => void;
};

const DatasetUploader: FC<Props> = ({ onUpload, isOpen, setIsOpen }) => {
  const inputFile = useRef<HTMLInputElement>(null);
  //const [isOpen, setIsOpen] = useState(false);
  const [filesState, setFiles] = useState<FileList | null>(null);
  const [isFileDragged, setIsFileDragged] = useState(false);
  const [isDraggedInside, setIsDraggedInside] = useState(false);
  const [fileUploadProgress, setFileUploadProgress] = useState<Progress>({
    state: 'idle',
  });
  const { data: algorithmsConfig } = useQuery<getAlgorithmsConfig>(
    GET_ALGORITHMS_CONFIG,
  );
  const [uploadDataset] = useMutation<uploadDataset, uploadDatasetVariables>(
    UPLOAD_DATASET,
  );

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsFileDragged(false);
  }, []);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsFileDragged(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsFileDragged(false);
  }, []);

  useEffect(() => {
    document.addEventListener('drop', onDrop);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('dragleave', onDragLeave);

    return () => {
      document.removeEventListener('drop', onDrop);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('dragleave', onDragLeave);
    };
  }, [onDragLeave, onDragOver, onDrop]);

  useEffect(() => {
    if (
      fileUploadProgress.state === 'fail' ||
      fileUploadProgress.state === 'complete'
    ) {
      setTimeout(() => setFileUploadProgress({ state: 'idle' }), 1500);
    }
  }, [fileUploadProgress]);

  const context: DefaultContext = {
    fetchOptions: {
      useUpload: true,
      onProgress: (ev: ProgressEvent) => {
        setFileUploadProgress({
          state: 'process',
          amount: ev.loaded / ev.total,
        });
      },
    },
  };

  const onChange = async (files: FileList | null) => {
    setIsDraggedInside(false);
    setFiles(files);
    setIsOpen(true);

    if (!algorithmsConfig) {
      setFileUploadProgress({ state: 'fail' });
      return;
    }

    const { allowedFileFormats, userDiskLimit } =
      algorithmsConfig?.algorithmsConfig.fileConfig;

    if (
      !files ||
      files.length !== 1 ||
      !allowedFileFormats.includes(files[0].type) ||
      files[0].size > userDiskLimit
    ) {
      setFileUploadProgress({ state: 'fail' });
      return;
    }
  };

  const onClose = () => {
    setFileUploadProgress({ state: 'idle' });
    setIsOpen(false);
  };

  const onSubmit = async (datasetProps) => {
    if (!filesState) return;

    try {
      const { data } = await uploadDataset({
        variables: {
          datasetProps,
          table: filesState[0],
        },
        context,
      });
      onUpload(data?.uploadDataset as AllowedDataset);
      setFileUploadProgress({ state: 'complete' });
    } catch (error) {
      setFileUploadProgress({ state: 'fail' });
    }
  };

  return (
    <>
      <div
        className={classNames(
          cardStyles.card,
          styles.uploader,
          isFileDragged && styles.dragged_outside,
          isDraggedInside && styles.dragged_inside,
          styles[fileUploadProgress.state],
        )}
        tabIndex={0}
        onClick={() => inputFile?.current?.click()}
        onDragEnter={() => setIsDraggedInside(true)}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggedInside(true);
        }}
        onDragLeave={() => setIsDraggedInside(false)}
        onDrop={(e) => onChange(e.dataTransfer.files)}
      >
        <div className={styles.uploader_title}>
          {fileUploadProgress.state === 'idle' &&
            !isFileDragged &&
            !isDraggedInside && (
              <>
                <Icon name="upload" size={20} />
                <p>Upload a File</p>
              </>
            )}
          {(isFileDragged || isDraggedInside) && (
            <>
              <Icon name="drag" size={20} />
              <p>Drop here</p>
            </>
          )}
          {fileUploadProgress.state === 'process' && (
            <>
              <Icon name="upload" size={20} />
              <p>Uploading...</p>
            </>
          )}
          {fileUploadProgress.state === 'complete' && (
            <>
              <Icon name="check" size={20} />
              <p>Complete</p>
            </>
          )}
          {fileUploadProgress.state === 'fail' && (
            <>
              <Icon name="cross" size={20} />
              <p>Error</p>
            </>
          )}
        </div>
        {fileUploadProgress.state !== 'idle' && (
          <ProgressBar progress={fileUploadProgress} />
        )}

        <input
          type="file"
          id="file"
          ref={inputFile}
          style={{ display: 'none' }}
          onChange={(e) => onChange(e.target.files)}
          multiple={false}
          accept=".csv, .CSV"
        />
      </div>
      <FilePropertiesModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </>
  );
};

export default DatasetUploader;
