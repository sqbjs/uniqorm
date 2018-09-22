module.exports = {
  name: 'uniqorm_2.customer_tags',
  createSql: (`
CREATE TABLE uniqorm_2.customer_tags
(
    customer_id integer NOT NULL,
    tag_id integer NOT NULL,
    active smallint NOT NULL default 1,
    CONSTRAINT customer_tags_pkey PRIMARY KEY (customer_id, tag_id),
    CONSTRAINT fk_customer_tags_customer FOREIGN KEY (customer_id)
        REFERENCES uniqorm_2.customers (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_customer_tags_tag FOREIGN KEY (tag_id)
        REFERENCES uniqorm_1.tags (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
  `),
  rows: [
    {
      customer_id: 1,
      tag_id: 1,
      active: 1
    }, {
      customer_id: 1,
      tag_id: 2,
      active: 1
    }, {
      customer_id: 1,
      tag_id: 3,
      active: 1
    }, {
      customer_id: 2,
      tag_id: 2,
      active: 1
    }, {
      customer_id: 2,
      tag_id: 3,
      active: 0
    }, {
      customer_id: 3,
      tag_id: 1,
      active: 0
    }, {
      customer_id: 3,
      tag_id: 2,
      active: 1
    }, {
      customer_id: 3,
      tag_id: 3,
      active: 1
    }, {
      customer_id: 4,
      tag_id: 1,
      active: 1
    }, {
      customer_id: 4,
      tag_id: 2,
      active: 1
    }, {
      customer_id: 4,
      tag_id: 3,
      active: 1
    }, {
      customer_id: 5,
      tag_id: 2,
      active: 1
    }, {
      customer_id: 5,
      tag_id: 3,
      active: 1
    }, {
      customer_id: 6,
      tag_id: 3,
      active: 1
    }, {
      customer_id: 7,
      tag_id: 2,
      active: 1
    }, {
      customer_id: 8,
      tag_id: 1,
      active: 1
    }, {
      customer_id: 8,
      tag_id: 2,
      active: 1
    }, {
      customer_id: 8,
      tag_id: 3,
      active: 1
    }, {
      customer_id: 9,
      tag_id: 1,
      active: 1
    }, {
      customer_id: 9,
      tag_id: 3,
      active: 1
    }, {
      customer_id: 10,
      tag_id: 2,
      active: 1
    }, {
      customer_id: 10,
      tag_id: 3,
      active: 1
    }, {
      customer_id: 11,
      tag_id: 1,
      active: 1
    }, {
      customer_id: 12,
      tag_id: 2,
      active: 1
    }, {
      customer_id: 13,
      tag_id: 3,
      active: 1
    }, {
      customer_id: 14,
      tag_id: 3,
      active: 1
    }, {
      customer_id: 14,
      tag_id: 1,
      active: 1
    }, {
      customer_id: 15,
      tag_id: 1,
      active: 1
    }, {
      customer_id: 16,
      tag_id: 2,
      active: 1
    }, {
      customer_id: 17,
      tag_id: 3,
      active: 1
    }, {
      customer_id: 18,
      tag_id: 1,
      active: 1
    }, {
      customer_id: 19,
      tag_id: 1,
      active: 0
    }, {
      customer_id: 19,
      tag_id: 2,
      active: 1
    }, {
      customer_id: 19,
      tag_id: 3,
      active: 1
    }
  ]
};
