import { GetServerSideProps, NextPage } from 'next';
import { NextSeo } from 'next-seo';
import Icon from '@components/Icon';
import TeamMemberBadge from '@components/TeamMemberBadge';
import cmsClient from '@graphql/cmsClient';
import { getTeamMembers } from '@graphql/operations/queries/__generated__/getTeamMembers';
import { GET_TEAM_MEMBERS } from '@graphql/operations/queries/getTeamMembers';
import styles from '@styles/Team.module.scss';

interface Props {
  team: getTeamMembers;
}

const Team: NextPage<Props> = ({ team }) => {
  const { teamMembers } = team;

  return (
    <>
      <NextSeo title="Team" />
      <div className={styles.teamPage}>
        <Icon name="backgroundHome" className={styles.background} />

        {teamMembers && teamMembers.data && teamMembers.data.length > 0 && (
          <ol className={styles.teamCardsContainer}>
            {teamMembers.data.map(
              ({ id, attributes }) =>
                attributes && <TeamMemberBadge data={attributes} key={id} />,
            )}
          </ol>
        )}
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const { data } = await cmsClient.query<getTeamMembers>({
    query: GET_TEAM_MEMBERS,
  });

  return {
    props: {
      team: data,
    },
  };
};

export default Team;
