-- Padroniza e-mails em minúsculas (Joao@x.com e joao@x.com eram alunos distintos).
-- Só atualiza onde não gera conflito. Duplicatas por caixa precisam de revisão manual:
--   SELECT lower(email), count(*) FROM student GROUP BY 1 HAVING count(*) > 1
UPDATE student SET email = lower(email)
WHERE email <> lower(email)
  AND NOT EXISTS (SELECT 1 FROM student s2 WHERE s2.email = lower(student.email) AND s2.id <> student.id);

UPDATE admin SET email = lower(email)
WHERE email <> lower(email)
  AND NOT EXISTS (SELECT 1 FROM admin a2 WHERE a2.email = lower(admin.email) AND a2.id <> admin.id);
