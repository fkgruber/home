    library(tidyverse)
    library(tidyquant)
    library(crypto)

    price_BTC <- getQuote("BTC-USD",what = yahooQF(c("Last Trade (Price Only)")))


    tq_get(c("btcusd", "btceur"),
	   get    = "tiingo.crypto",
	   from   = "2020-01-01",
	   to     = "2020-01-15",
	   resample_frequency = "5min")

    btc <- getCoins("Bitcoin")

    xbt_reader <- function(symbol = "XBT", 
			   timeframe = "1d", 
			   count = "1000", 
			   starttime = "",
			   reverse = 'false'){
  
      base <- "https://www.bitmex.com/api/v1/trade/bucketed?"
      symbol = symbol
      timeframe = timeframe
      count = count
      starttime = starttime
  
      url <- paste0(base, 
		    'binSize=', timeframe, 
		    '&partial=false&symbol=', symbol, 
		    '&count=', count, 
		    '&reverse=', reverse,
		    '&startTime=', starttime)
  
     result <- tibble(data = content(GET(url), "parsed")) %>%
	unnest_wider(data)
    }


    tst = getSymbols(c("AAPL"), from = '2020-01-01',
	       to = "2020-12-13",warnings = FALSE,
	       auto.assign = F)

    getSymbols(c("BTC-USD"), from = '2020-01-01',src="yahoo", 
	       to = "2020-12-13",warnings = FALSE,
	       auto.assign = F) %>% head

    tmp = AAPL %>% as.data.frame() %>% 
      mutate(Date = rownames(.)) %>% as_tibble() 

    tmp%>%
      ggplot(aes(x = Date, y = AAPL.Close)) + geom_line()

    library(dygraphs)

    dygraph(AAPL)

    sts = data.frame(Date = c("2000/01/01", "2000/02/03"), Value = c(10, 20))
    rownames(sts) = sts$Date
    sts$Date = NULL

    dygraph(
      as.xts(sts)
      )

Sys.setenv(PATH=paste0("C:\\Program Files\\Pandoc\\;",Sys.getenv("PATH")))
rmarkdown::run("stocks.Rmd")
