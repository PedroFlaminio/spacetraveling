/* eslint-disable consistent-return */
import { useEffect } from 'react';

export const useUtterances = (commentNodeId: string): void => {
  useEffect(() => {
    const scriptParentNode = document.getElementById(commentNodeId);

    if (!scriptParentNode) return;

    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.setAttribute(
      'repo',
      process.env.NEXT_PUBLIC_REPO_NAME_GITHUB_UTTERANCES
    );
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'photon-dark');
    script.setAttribute('crossorigin', 'anonymous');

    scriptParentNode.appendChild(script);

    return () => {
      scriptParentNode.removeChild(scriptParentNode.firstChild as Node);
    };
  }, [commentNodeId]);
};
