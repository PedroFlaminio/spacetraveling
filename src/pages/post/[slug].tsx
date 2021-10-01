/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { v4 as uuid } from 'uuid';
import Head from 'next/head';
import Link from 'next/link';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { Comments } from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

type PrevNextPost = {
  slug: string;
  title: string;
};

interface PostProps {
  post: Post;
  lastEditTime: string;
  preview: boolean;
  prevPost: PrevNextPost | null;
  nextPost: PrevNextPost | null;
}

export default function Post({
  post,
  lastEditTime,
  preview,
  prevPost,
  nextPost,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const wordAmount = post.data.content.reduce((ac, value) => {
    const headingLetterAmount = value.heading?.match(/\S+/g).length;
    const bodyLetterAmount = RichText.asText(value.body).match(/\S+/g).length;
    return ac + (headingLetterAmount + bodyLetterAmount);
  }, 0);

  const readingTime = Math.ceil(wordAmount / 200);

  return (
    <>
      <Head>
        <title>Post | spacetraveling.</title>
      </Head>
      <Header />

      <main className={styles.postContainer}>
        <div
          className={styles.banner}
          style={{
            backgroundImage: `url('${post.data.banner.url}')`,
          }}
        />
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={commonStyles.info}>
            <time>
              <FiCalendar />
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>
            <span>
              <FiUser />
              {post.data.author}
            </span>
            <span>
              <FiClock />
              {readingTime} min
            </span>
          </div>
          {lastEditTime && lastEditTime !== post.first_publication_date && (
            <span className={styles.lastEditTime}>
              {format(
                new Date(lastEditTime),
                "'*editado em' dd MMM yyyy 'às' p",
                {
                  locale: ptBR,
                }
              )}
            </span>
          )}
          {post.data.content.map(content => (
            <div key={uuid()} className={styles.postContent}>
              <h2>{content.heading}</h2>
              <div
                className={styles.body}
                dangerouslySetInnerHTML={{
                  __html: String(RichText.asHtml(content.body)),
                }}
              />
            </div>
          ))}
          <div className={styles.divider} />

          <div className={styles.prevNextPost}>
            <div>
              {prevPost && (
                <>
                  <h3>{prevPost.title}</h3>
                  <Link href={`/post/${prevPost.slug}`}>
                    <a>Post anterior</a>
                  </Link>
                </>
              )}
            </div>

            <div>
              {nextPost && (
                <>
                  <h3>{nextPost.title}</h3>
                  <Link href={`/post/${nextPost.slug}`}>
                    <a>Próximo post</a>
                  </Link>
                </>
              )}
            </div>
          </div>

          {preview && (
            <aside>
              <Link href="/api/exit-preview">
                <a className={commonStyles.exitPreviewButton}>
                  Sair do modo preview
                </a>
              </Link>
            </aside>
          )}
        </article>
        <Comments />
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      orderings: '[document.first_publication_date desc]',
    }
  );

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(params.slug), {
    ref: previewData?.ref ?? null,
  });

  const post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => ({
        heading: content.heading,
        body: content.body,
      })),
    },
  };

  const prevPostResponse = (
    await prismic.query(Prismic.Predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: response?.id,
      orderings: '[document.first_publication_date]',
    })
  ).results[0];

  const prevPost = prevPostResponse
    ? {
        slug: prevPostResponse.uid,
        title: prevPostResponse.data?.title,
      }
    : null;

  const nextPostResponse = (
    await prismic.query(Prismic.Predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: response?.id,
      orderings: '[document.first_publication_date desc]',
    })
  ).results[0];

  const nextPost = nextPostResponse
    ? {
        slug: nextPostResponse.uid,
        title: nextPostResponse.data?.title,
      }
    : null;

  return {
    props: {
      post,
      lastEditTime: response.last_publication_date,
      preview,
      prevPost,
      nextPost,
    },
  };
};
