#!/usr/bin/env python
# coding: utf-8


# In[1]:


import pandas as pd
pd.options.mode.chained_assignment = None


# In[2]:


titles = pd.read_csv("netflix_titles.csv")
movies = pd.read_csv("IMDb movies.csv")
ratings = pd.read_csv("IMDb ratings.csv")


# In[3]:

# Try to write the partial code and let Xavier complete the rest: joined = titles.merge(movies, 
joined = titles.merge(movies, left_on="netflixTitle", right_on="title")


# In[4]:

# Try to write the partial code and let Xavier complete the rest: joined = 
joined = joined.merge(ratings, left_on="imdb_title_id", right_on="imdbTitle_ID")


# In[5]:

# Try to write the partial code and let Xavier complete the rest: joined["tot_vote"] = 
joined["tot_vote"] = joined["votes_10"] + joined["votes_9"] + joined["votes8"]


# In[6]:

# Try to write the partial code and let Xavier complete the rest: joined2 = joined[["netflixTitle", 
joined2 = joined[["netflixTitle", "durationOfTime", "nf_type", "tot_vote"]]


# In[7]:

# Try to write the partial code and let Xavier complete the rest: joined2 = joined2[joined2["nf_type"]
joined2 = joined2[joined2["nf_type"] == "Film"]


# In[8]:

# Try to write the partial code and let Xavier complete the rest: joined2["durationOfTime"] = joined2["durationOfTime"]
joined2["durationOfTime"] = joined2["durationOfTime"].str.replace(" minutes", "")


# In[9]:

# Try to write the partial code and let Xavier complete the rest: joined2 = joined2[["net
joined2 = joined2[["netflixTitle", "durationOfTime", "tot_vote"]]
joined2

