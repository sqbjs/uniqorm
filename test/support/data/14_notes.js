module.exports = {
  name: 'uniqorm_2.notes',
  createSql: (`
CREATE TABLE uniqorm_2.notes
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
