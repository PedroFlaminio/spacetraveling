import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Head from 'next/head';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleGetMorePosts(): Promise<void> {
    await fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        const newPosts = data.results.map(post => ({
          uid: post.uid,
          first_publication_date: format(
            new Date(post.first_publication_date),
            'dd MMM yyyy',
            {
              locale: ptBR,
            }
          ),
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author,
          },
        }));

        setPosts([...posts, ...newPosts]);
        setNextPage(data.next_page);
      });
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling.</title>
      </Head>

      <main className={styles.container}>
        <img src="/images/logo.svg" alt="logo" />
        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div className={commonStyles.info}>
                  <time>
                    <FiCalendar />
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </time>
                  <span>
                    <FiUser />
                    {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}
        </div>
        {nextPage && (
          <button
            className={styles.morePostsButton}
            onClick={handleGetMorePosts}
            type="button"
          >
            Carregar mais posts
          </button>
        )}

        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a className={commonStyles.exitPreviewButton}>
                Sair do modo preview
              </a>
            </Link>
          </aside>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 10,
      ref: previewData?.ref ?? null,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const posts = postsResponse.results.map(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: { postsPagination, preview },
  };
};
