from nltk.sentiment.vader import SentimentIntensityAnalyzer
import math

def analyze(paragraph):
    sid = SentimentIntensityAnalyzer()
    ss = sid.polarity_scores(paragraph)
    l = math.log(len(paragraph))
    score = ss['compound']
    return l*score
    
