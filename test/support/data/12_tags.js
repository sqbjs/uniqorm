module.exports = {
  name: 'uniqorm_test.tags',
  createSql: (`
CREATE TABLE uniqorm_test.tags
(
    id integer NOT NULL,
    name character varying (20) COLLATE pg_catalog."default" NOT NULL,    
    CONSTRAINT tags_pkey PRIMARY KEY (id)
)
  `),
  rows: [
    {
      id: 1,
      name: 'Yellow'
    }, {
      id: 2,
      name: 'Red'
    }, {
      id: 3,
      name: 'Green'
    }
  ]
};
