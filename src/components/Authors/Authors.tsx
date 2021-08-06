
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import styled from '@emotion/styled';
import axios from 'axios';

/*
Require: config.features.editOnRepo.editable = true
We collect `Author` field, ref: https://stackoverflow.com/a/6755848/4540808
*/

interface IAuthorsProps{
  className: string;
  path: string;
  repoType: string;
  repo: string;
  contentRootPath: string;
  locationPathname: string;
}

interface IAuthorInfo{
  username?: string; 
  name: string;
  commitsCount: number;
  profileUrl: string;
}

const initAuthorList :IAuthorInfo[] = [];

const Authors = styled(({ className, path,  repoType, repo, contentRootPath, locationPathname}: IAuthorsProps) => {
  const [authorList, setAuthorList] = useState(initAuthorList);
  const [lastUpdate, setLastUpdate] = useState('');
  if (repoType.toLowerCase() !== 'github') return <></>;
  const contributorsGithubAPI = `https://api.github.com/repos/${repo}/commits?path=/${contentRootPath}/${path}`;

  const fetchContributors = async () => {

    const axiosConfig = {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    }
    const response = await axios.get(contributorsGithubAPI,axiosConfig);
    const allAuthors: IAuthorInfo[] = response.data
      // Map all commit to duplicated authors.
      .map(commit => {
        return {
          // Get Github username or Email, sometime we can't get author from the API.
          username: commit?.author?.login || commit?.commit?.author.email,
          name: commit?.commit?.author.name,
          profileUrl: commit?.author?.html_url || commit?.html_url,
          commitsCount: 1, // default to 1
        };
      })
      // Remove author if username is undefined 
      .filter(currentAuthor => currentAuthor.username);

    // Create a unique author and increase commits count if an author has more than one commit.
    const uniqueAuthors = allAuthors.reduce((authors, currentAuthor) => {
      const usernameKey = currentAuthor.username;
      const uniqueAuthor = authors[usernameKey];
      if (uniqueAuthor) {
        uniqueAuthor.commitsCount++;
      } else {
        authors[usernameKey] = currentAuthor;
      }

      return authors;
    }, {} as Record<string, IAuthorInfo>);

    // Flatting to array of author and sort by commits number descending
    const sortedByCommitsCountAuthors = Object.entries(uniqueAuthors)
      .map(([, author]) => author)
      .sort((a, b) => (a.commitsCount < b.commitsCount) ? 1 : -1)

    // Set to React state
    setAuthorList([...sortedByCommitsCountAuthors]);

    // Last update
    const lastCommitDate = response.data[0].commit.author.date;
    setLastUpdate(format(new Date(lastCommitDate),"MMM dd, yyyy"));
  }

  useEffect(()=> {
    setAuthorList([]);
    fetchContributors();
  }, [locationPathname]);
  
  return (
    <span className={className}>
     Last update: {lastUpdate}<br/>
     Authors: {authorList.map((author, authorIndex) => (
       <span key={author.username}><a href={author.profileUrl} target="_blank" rel="noreferrer">{author.name}</a>
       {authorList.length -1 === authorIndex? '' : ', '}
       </span>
     ))}
    </span>
  );

})`
  font-size: 12px;
  display: block;

  a, a:active, a:visited { 
    color: ${(props) => props.theme.colors.primary}
  }

  a:hover {
    color: ${(props) => props.theme.colors.primaryDark}
  }
`;
export default Authors;
