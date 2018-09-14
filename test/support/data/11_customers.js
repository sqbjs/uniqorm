module.exports = {
  name: 'uniqorm_test.customers',
  createSql: (`
CREATE TABLE uniqorm_test.customers
(
    id integer NOT NULL,
    name character varying(20) COLLATE pg_catalog."default" NOT NULL,
    street_id integer NOT NULL,
    CONSTRAINT customers_pkey PRIMARY KEY (id),
    CONSTRAINT fk_customers_street FOREIGN KEY (street_id)
        REFERENCES uniqorm_test.streets (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
  `),
  rows: [
    {
      id: 1,
      name: 'Neuer, Friedrich',
      street_id: 1
    }, {
      id: 2,
      name: 'Muller, Jürgen',
      street_id: 2
    }, {
      id: 3,
      name: 'Werner, Peter',
      street_id: 3
    }, {
      id: 4,
      name: 'Moreno, Santiago',
      street_id: 4
    }, {
      id: 5,
      name: 'Abeledo, Sebastián',
      street_id: 5
    }, {
      id: 6,
      name: 'Fernández, Samuel',
      street_id: 6
    }, {
      id: 7,
      name: 'Abeledo, Alejandro',
      street_id: 7
    }, {
      id: 8,
      name: 'Alfaro, Diego',
      street_id: 7
    }, {
      id: 9,
      name: 'Jonquet, Patrick',
      street_id: 8
    }, {
      id: 10,
      name: 'Giresse, Jean',
      street_id: 8
    }, {
      id: 11,
      name: 'Cantona, Bernard',
      street_id: 9
    }, {
      id: 12,
      name: 'Silvestre, Franck',
      street_id: 10
    }, {
      id: 13,
      name: 'Mathieu, Antoine',
      street_id: 11
    }, {
      id: 14,
      name: 'Wright, John',
      street_id: 12
    }, {
      id: 15,
      name: 'Samedov, Yuri',
      street_id: 13
    }, {
      id: 16,
      name: 'Samedov, Yuri',
      street_id: 13
    }, {
      id: 17,
      name: 'Topcu, Ahmet',
      street_id: 14
    }, {
      id: 18,
      name: 'Tuna, Canan',
      street_id: 14
    }, {
      id: 19,
      name: 'Meric, Jale',
      street_id: 15
    }
  ]
};
