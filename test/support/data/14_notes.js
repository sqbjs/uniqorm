module.exports = {
  name: 'uniqorm_test.notes',
  createSql: (`
CREATE TABLE uniqorm_test.notes
(
    id SERIAL NOT NULL,
    source character varying (20) COLLATE pg_catalog."default" NOT NULL,
    source_key integer NOT NULL,    
    contents character varying (128) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT notes_pkey PRIMARY KEY (id)
)
  `),
  rows: [
    {
      source: 'customers',
      source_key: 19,
      contents: 'note 1',
    }, {
      source: 'customers',
      source_key: 19,
      contents: 'note 2',
    }, {
      source: 'customers',
      source_key: 1,
      contents: 'note 3',
    }
  ]
};
