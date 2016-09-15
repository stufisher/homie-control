<?php 

namespace App\Modules\Group;
use App\BaseController as BaseController;

class Controller extends BaseController {

    // Group Components
    protected function _get_pgcs() {
        $where = '';
        $args = array($this->settings['homie']['base_topic']);

        if ($this->args->has('propertygroupid')) {
            $where .= ' AND pgc.propertygroupid=:'.(sizeof($args)+1);
            array_push($args, $this->args->value('propertygroupid'));
        }

        $props = $this->db->pq("SELECT CONCAT(:1, '/', p.devicestring, '/', p.nodestring, IF(p.propertystring IS NOT NULL, CONCAT('/', p.propertystring), '')) as address, p.friendlyname as propertyname, pt.name as propertytype, pgc.propertygroupcomponentid, p.propertyid
            FROM property p
            INNER JOIN propertytype pt ON p.propertytypeid = pt.propertytypeid
            INNER JOIN propertygroupcomponent pgc ON pgc.propertyid = p.propertyid
            WHERE 1 $where
            GROUP BY p.propertyid", $args);

        $this->output($props);
    }

    protected function _add_pgc() {
        $this->required('propertyid');
        $this->required('propertygroupid');

        $this->db->pq("INSERT INTO propertygroupcomponent (propertyid,propertygroupid) 
            VALUES (:1, :2)", [$this->args->value('propertyid'), $this->args->value('propertygroupid')]);
        $this->output(['propertygroupcomponentid' => $this->db->id()]);
    }

    protected function _delete_pgc() {
        $this->required('propertygroupcomponentid');
        
        $this->db->pq("DELETE FROM propertygroupcomponent WHERE propertygroupcomponentid=:1", [$this->args->value('propertygroupcomponentid')]);

        $this->output();
    }


    // Group Components
    protected function _get_pgs() {
        $where = '';
        $args = array();

        if ($this->args->has('history')) {
            $where .= ' AND pg.history=1';
        }

        $groups = $this->db->pq("SELECT pg.name,pg.propertygroupid,count(pgc.propertygroupid) as properties, history
            FROM propertygroup pg
            LEFT OUTER JOIN propertygroupcomponent pgc ON pgc.propertygroupid = pg.propertygroupid
            WHERE 1 $where
            GROUP BY pg.propertygroupid", $args);

        $this->output($groups);
    }

    protected function _add_pg() {
        $this->required('name');

        $this->db->pq("INSERT INTO propertygroup (name, history) VALUES (:1, :2)", [$this->args->value('name'), $this->args->value('history', 1)]);
        $this->output(['propertygroupid' => $this->db->id()]);
    }

    protected function _patch_pg() {
        $this->required('propertygroupid');

        foreach (['name', 'history'] as $k) {
            if ($this->args->has($k)) {
                $v = $this->args->value($k);
                $fl = ':1';
                $this->db->pq("UPDATE propertygroup set $k=$fl WHERE propertygroupid=:2", [$v, $this->args->value('propertygroupid')]);
                $this->output([ $k => $v ]);    
            }
        }
    }

    protected function _delete_pg() {
        $this->required('propertygroupid');
        $this->db->pq("DELETE FROM propertygroup WHERE propertygroupid=:1", [$this->args->value('propertygroupid')]);
        $this->output();
    }




    // Subgroup Components
    protected function _get_psgcs() {
        $where = '';
        $args = array($this->settings['homie']['base_topic']);

        if ($this->args->has('propertysubgroupid')) {
            $where .= ' AND pgc.propertysubgroupid=:'.(sizeof($args)+1);
            array_push($args, $this->args->value('propertysubgroupid'));
        }

        $props = $this->db->pq("SELECT CONCAT(:1, '/', p.devicestring, '/', p.nodestring, IF(p.propertystring IS NOT NULL, CONCAT('/', p.propertystring), '')) as address, p.friendlyname as propertyname, pt.name as propertytype, pgc.propertysubgroupcomponentid, p.propertyid
            FROM property p
            INNER JOIN propertytype pt ON p.propertytypeid = pt.propertytypeid
            INNER JOIN propertysubgroupcomponent pgc ON pgc.propertyid = p.propertyid
            WHERE 1=1 $where
            GROUP BY p.propertyid", $args);

        $this->output($props);    
    }

    protected function _add_psgc() {
        $this->required('propertyid');
        $this->required('propertysubgroupid');

        $this->db->pq("INSERT INTO propertysubgroupcomponent (propertyid,propertysubgroupid) 
            VALUES (:1, :2)", [$this->args->value('propertyid'), $this->args->value('propertysubgroupid')]);
        $this->output(['propertysubgroupcomponentid' => $this->db->id()]);
    }

    protected function _delete_psgc() {
        $this->required('propertysubgroupcomponentid');
        
        $this->db->pq("DELETE FROM propertysubgroupcomponent WHERE propertysubgroupcomponentid=:1", [$this->args->value('propertysubgroupcomponentid')]);

        $this->output();
    }


    // Subgroup
    protected function _get_psgs() {
        $where = '';
        $args = [];

        if ($this->args->has('propertygroupid')) {
            $where .= ' AND pg.propertygroupid=:'.(sizeof($args)+1);
            array_push($args, $this->args->value('propertygroupid'));
        }

        $groups = $this->db->pq("SELECT pg.name,pg.propertysubgroupid,count(pgc.propertysubgroupid) as properties
            FROM propertysubgroup pg
            LEFT OUTER JOIN propertysubgroupcomponent pgc ON pgc.propertysubgroupid = pg.propertysubgroupid
            WHERE 1=1 $where
            GROUP BY pg.propertysubgroupid", $args);
        $this->output($groups);
    }

    protected function _add_psg() {
        $this->required('name');
        $this->required('propertygroupid');

        $this->db->pq("INSERT INTO propertysubgroup (name, propertygroupid) VALUES (:1, :2)", [$this->args->value('name'), $this->args->value('propertygroupid')]);
        $this->output([ 'propertysubgroupid' => $this->db->id() ]);
    }

    protected function _patch_psg() {
        $this->required('propertysubgroupid');
        foreach (['name'] as $k) {
            if ($this->args->has($k)) {
                $v = $this->args->value($k);
                $fl = ':1';
                $this->db->pq("UPDATE propertysubgroup set $k=$fl WHERE propertysubgroupid=:2", [$v, $this->args->value('propertysubgroupid')]);
                $this->output([ $k => $v ]);    
            }
        }
    }

    protected function _delete_psg() {
        $this->required('propertysubgroupid');
        $this->db->pq("DELETE FROM propertysubgroup WHERE propertysubgroupid=:1", [$this->args->value('propertysubgroupid')]);
        $this->output();
    }


}