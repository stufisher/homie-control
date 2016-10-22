<?php 

namespace App\Modules\Misc;
use App\BaseController as BaseController;

class Controller extends BaseController {

    protected function _get_options() {
        $rows = $options = $this->db->pq("SELECT name,value FROM options");
        $opts = ['id' => 1];
        foreach ($rows as $r) $opts[$r['name']] = $r['value'];
        $this->output($opts);
    }


    protected function _patch_options() {
        foreach (['latitude', 'longitude', 'timezone', 
                'heating_reading_property', 'heating_control_property', 'profile_exec_property', 'trigger_email_to'] as $k) {
            if ($this->args->has($k)) {
                $v = $this->args->value($k);
                $fl = ':1';
                $this->db->pq("UPDATE options set value=$fl WHERE name=:2", [$v, $k]);
                $this->output([ $k => $v ]);
            }
        }
    }



    protected function _get_pages() {
        $where = '';
        $args = [];

        if ($this->args->has('pageid')) {
            $where = ' AND pageid=:'.(sizeof($args)+1);
            array_push($args, $this->args->value('pageid'));
        }

        $rows = $options = $this->db->pq("SELECT pageid,title,template,slug,config,display_order FROM pages
            ORDER BY display_order");

        if ($this->args->has('pageid')) {
            if (sizeof($rows)) $this->output($rows[0]);
            else $this->error('No such page');

        } else $this->output($rows);
        
    }

    protected function _add_page() {
        $this->required('title');
        $this->required('slug');
        $this->required('template');

        $this->db->pq("INSERT INTO pages (title, slug, template, display_order) VALUES (:1, :2, :3, :4)", [$this->args->value('title'), $this->args->value('slug'), $this->args->value('template'), $this->args->value('display_order', 0)]);

        $this->output(['pageid' => $this->db->id()]);
    }

    protected function _patch_page() {
        $this->required('pageid');

        foreach (['title', 'slug', 'template', 'config', 'display_order'] as $k) {
            if ($this->args->has($k)) {
                $v = $this->args->value($k);
                $fl = ':1';
                $this->db->pq("UPDATE pages set $k=$fl WHERE pageid=:2", [$v, $this->args->value('pageid')]);
                $this->output([ $k => $v ]);    
            }
        }
    }

    protected function _delete_page() {
        $this->required('pageid');
        
        $this->db->pq("DELETE FROM pages WHERE pageid=:1", [$this->args->value('pageid')]);

        $this->output(new \stdClass);
    }


}