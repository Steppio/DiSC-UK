<?php

$installer = $this;
/** @var $installer Enterprise_CatalogEvent_Model_Resource_Setup */

$installer->startSetup();

$installer->run("ALTER TABLE {$this->getTable('clnews/category')} ADD `path` varchar(150) NOT NULL DEFAULT '' AFTER parent_id;");

$sql = "SELECT category_id, parent_id FROM {$this->getTable('clnews/category')}";
$query = $installer->getConnection()->query($sql);
while ($row = $query->fetch()) {
    $parentId = (int)$row['parent_id'];
    $path = array();
    $path[] = $row['category_id'];
    if ($parentId) {
        $path[] = $row['parent_id'];
    }
    while($parentId!=0) {
        $sql = "SELECT parent_id FROM {$this->getTable('clnews/category')} WHERE category_id = ".$parentId;
        $result = $installer->getConnection()->query($sql);
        $values = $result->fetch();
        $parentId = $values['parent_id'];
        if ($parentId!=0) {
            $path[] = $values['parent_id'];
        }
    }
    $path = implode('/', array_reverse($path));

    $installer->run("UPDATE {$this->getTable('clnews/category')} SET path = '".$path."' WHERE category_id = ".$row['category_id'].";");
}
$installer->run("DELETE FROM {$this->getTable('core/config_data')} WHERE path = 'clnews/news/itemurlsuffix';");

$installer->endSetup();