import { ReactElement } from 'react';
import { useUtterances } from '../../hooks/useUtterances';

const commentNodeId = 'comments';

export const Comments = (): ReactElement => {
  useUtterances(commentNodeId);
  return <div id={commentNodeId} />;
};
