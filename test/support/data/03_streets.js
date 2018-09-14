module.exports = {
  name: 'uniqorm_test.streets',
  createSql: (`
CREATE TABLE uniqorm_test.streets
(
    id integer NOT NULL,
    city_id integer NOT NULL,
    name character varying (64) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT streets_pkey PRIMARY KEY (id),
    CONSTRAINT fk_streets_city FOREIGN KEY (city_id)
        REFERENCES uniqorm_test.cities (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
  `),
  rows: [
    {
      id: 1,
      city_id: 1,
      name: 'Hanauer Straße'
    }, {
      id: 2,
      city_id: 1,
      name: 'Karmeliterstraße'
    }, {
      id: 3,
      city_id: 1,
      name: 'Maillingerstraße'
    }, {
      id: 4,
      city_id: 2,
      name: 'Mármoles'
    }, {
      id: 5,
      city_id: 3,
      name: 'La Rambla Barcelona'
    }, {
      id: 6,
      city_id: 3,
      name: 'Rambla de Catalunya'
    }, {
      id: 7,
      city_id: 4,
      name: 'Puerta del Sol'
    }, {
      id: 8,
      city_id: 5,
      name: 'Rue Cler'
    }, {
      id: 9,
      city_id: 5,
      name: 'Rue des Rosiers'
    }, {
      id: 10,
      city_id: 6,
      name: 'La Place Ampère'
    }, {
      id: 11,
      city_id: 6,
      name: 'Avenue Berthelot'
    }, {
      id: 12,
      city_id: 7,
      name: 'Hardicker Street'
    }, {
      id: 13,
      city_id: 8,
      name: '10th Street Park'
    }, {
      id: 14,
      city_id: 9,
      name: 'Bagdat Avenue'
    }, {
      id: 15,
      city_id: 10,
      name: 'Ataturk Avenue'
    }

  ]
};
