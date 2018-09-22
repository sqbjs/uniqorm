module.exports = {
  name: 'uniqorm_1.countries',
  createSql: (`
CREATE TABLE uniqorm_1.countries
(
    id character varying (5) COLLATE pg_catalog."default" NOT NULL,
    name character varying (20) COLLATE pg_catalog."default" NOT NULL,
    phone_code smallint,
    CONSTRAINT countries_pkey PRIMARY KEY (id)
);
COMMENT ON TABLE uniqorm_1.countries IS 'countries table';
COMMENT ON COLUMN uniqorm_1.countries.phone_code IS 'Universal phone code number';    
  `),
  rows: [
    {
      id: 'DEU',
      name: 'Germany',
      phone_code: 49
    }, {
      id: 'ESP',
      name: 'Spain',
      phone_code: 34
    }, {
      id: 'FRA',
      name: 'France',
      phone_code: 33
    }, {
      id: 'GBR',
      name: 'United Kingdom',
      phone_code: 44
    }, {
      id: 'RUS',
      name: 'Russia',
      phone_code: 7
    }, {
      id: 'TUR',
      name: 'Turkey',
      phone_code: 90
    }

  ]
};
