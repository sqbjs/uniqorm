module.exports = {
  name: 'uniqorm_1.tags',
  createSql: (`
CREATE TABLE uniqorm_1.tags
(
    id SERIAL NOT NULL,
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
