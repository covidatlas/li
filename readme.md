# Li

> ### An evented crawler designed to aggregate COVID-19 ("Coronavirus") data from official government sources and trusted data providers.

This project exists to crawl, scrape, de-duplicate, and cross-check COVID-19 pandemic data down to the county.

Every piece of data collected is accessible tagged with GeoJSON, population data, citations of the sources from which the data was obtained, and other related metadata.

# Consumers

<!--
## Where's the data?

TBD

## How often is it updated?

Constantly.

TBD.

## How do I use this data?

TBD ... Read the [Data Fields](./docs/data_fields.md) documentation for
details on exactly what each field in the dataset means.
-->

## Reports

* [V1 reports](./docs/reports-v1.md)
* [Migrating from CDS data to Li data](./docs/reports-migrating-from-cds-to-li.md).  The prior version of this project, [coronadatascraper](https://github.com/covidatlas/coronadatascraper), generates and hosts reports at https://coronadatascraper.com/#home.  Eventually, these reports will be discontinued.


# Developers

## Get started

Check out our [Getting Started](./docs/getting_started.md) guide to help get our project running on your local machine.

## Contributing

You can contribute to this project in two big ways:


### Contribute to the project

Check the Issues for any task we need to get done. If you are new to open source, look for the label [`Good first issue`](https://github.com/covidatlas/li/labels/good%20first%20issue)


### Contribute a source

Contributions for any place in the world are welcome. See the
[community-curated list of verified data
sources](https://docs.google.com/spreadsheets/d/1T2cSvWvUvurnOuNFj2AMPGLpuR2yVs3-jdd_urfWU4c/edit#gid=0)
to find a new data source to add, and be sure to update the "Scraped?"
column when you do.

To help you contribute a new source, please read the
[Sources](./docs/sources.md) guide before you start!

Send a pull request with your source, and be sure to crawl and scrape the source
first with the instructions specified in the guide to make sure the
data is valid.

## License

Li is licensed under [Apache 2.0](/LICENSE).

The data produced by this project is public domain.

This project uses data from [ISO-3166 Country and Dependent Territories Lists with UN Regional Codes](https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes) under the [Creative Commons Attribution-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-sa/4.0/).


## Attribution

Please cite this project if you use it in visualization, reporting, or any derivative works that benefit from it.


## About the name

This project's namesake, Li, was given [in honor and observance of Dr. Li Wenliang](https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(20)30382-2/fulltext).


## Thank you

COVID Atlas would also like to acknowledge the services provided by our [hosting partner AWS](https://aws.amazon.com/).
