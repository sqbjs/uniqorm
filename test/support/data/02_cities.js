module.exports = {
  name: 'uniqorm_1.cities',
  createSql: (`
CREATE TABLE uniqorm_1.cities
(
    id integer NOT NULL,
    country_id character varying (5) NOT NULL,
    name character varying (20) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT cities_pkey PRIMARY KEY (id),
    CONSTRAINT fk_cities_country FOREIGN KEY (country_id)
        REFERENCES uniqorm_1.countries (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
  `),
  rows: [
    {
      id: 1,
      country_id: 'DEU',
      name: 'Munich'
    }, {
      id: 2,
      country_id: 'ESP',
      name: 'Seville'
    }, {
      id: 3,
      country_id: 'ESP',
      name: 'Barcelona'
    }, {
      id: 4,
      country_id: 'ESP',
      name: 'Madrid'
    }, {
      id: 5,
      country_id: 'FRA',
      name: 'Paris'
    }, {
      id: 6,
      country_id: 'FRA',
      name: 'Lyon'
    }, {
      id: 7,
      country_id: 'GBR',
      name: 'Manchester'
    }, {
      id: 8,
      country_id: 'RUS',
      name: 'Moscow'
    }, {
      id: 9,
      country_id: 'TUR',
      name: 'Istanbul'
    }, {
      id: 10,
      country_id: 'TUR',
      name: 'Izmir'
    }

  ]
};
