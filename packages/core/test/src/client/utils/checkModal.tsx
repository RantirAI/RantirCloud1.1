import { waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormItemCheckOptions, checkFormItems } from '../formItemChecker';
import { expectNoTsError, sleep } from './utils';

export interface CheckModalOptions {
  triggerText?: string;
  modalTitle?: string;
  confirmTitle?: string;
  submitText?: string;
  contentText?: string;
  beforeCheck?: () => Promise<void> | void;
  customCheck?: () => Promise<void> | void;
  formItems?: FormItemCheckOptions[];
  afterSubmit?: () => Promise<void> | void;
}

export async function checkModal(options: CheckModalOptions) {
  const { triggerText, modalTitle, confirmTitle, submitText = 'OK', formItems = [] } = options;

  await waitFor(() => {
    expectNoTsError(screen.queryByText(triggerText)).toBeInTheDocument();
  });

  await userEvent.click(screen.getByText(triggerText));

  await waitFor(() => {
    expectNoTsError(screen.queryByRole('dialog')).toBeInTheDocument();
  });

  const dialog = screen.getByRole('dialog');

  if (modalTitle) {
    expectNoTsError(dialog.querySelector('.ant-modal-title')).toHaveTextContent(modalTitle);
  }

  if (confirmTitle) {
    expectNoTsError(dialog.querySelector('.ant-modal-confirm-title')).toHaveTextContent(confirmTitle);
  }

  if (options.contentText) {
    expectNoTsError(dialog).toHaveTextContent(options.contentText);
  }

  if (options.beforeCheck) {
    await options.beforeCheck();
  }

  if (options.customCheck) {
    await options.customCheck();
  }

  await checkFormItems(formItems);

  await userEvent.click(screen.getByText(submitText));

  await waitFor(() => {
    expectNoTsError(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  if (options.afterSubmit) {
    await sleep(100);
    await options.afterSubmit();
  }
}
